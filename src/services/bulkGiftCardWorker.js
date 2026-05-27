/**
 * @file bulkGiftCardWorker.js
 * @description Background processing service for bulk gift card campaigns.
 * Utilizes chunking, throttling (delay pauses), and atomic database transactions.
 * Logs success/failure states to MongoDB for high-fidelity auditing and self-healing.
 * @module services/bulkGiftCardWorker
 */

import mongoose from 'mongoose';
import GiftCard from '../models/giftCard.model.js';
import GiftCardInvite from '../models/giftCardInvite.model.js';
import GiftCardTransaction from '../models/giftCardTransaction.model.js';
import GiftCardBatch from '../models/giftCardBatch.model.js';
import { sendGiftCardInviteEmail } from '../utils/email.js';

// Helper utility to pause execution thread for throttling (rate limiting SMTP/DB)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process a bulk campaign asynchronously in non-blocking batches.
 * @param {string} batchId - The Mongoose ID of the GiftCardBatch document
 * @param {string[]} emails - Deduplicated array of recipient emails
 */
export const processBulkGiftCards = async (batchId, emails) => {
  console.log(`[WORKER] Initiating bulk processing for Batch: ${batchId} with ${emails.length} recipients`);
  
  try {
    // 1. Fetch current campaign metadata and set active state
    const batch = await GiftCardBatch.findById(batchId);
    if (!batch) {
      console.error(`[WORKER] Batch document ${batchId} not found. Aborting worker.`);
      return;
    }

    batch.status = 'processing';
    await batch.save();

    // Configuration for production stability
    const chunkSize = 10;       // Max concurrent tasks per tick
    const delayMs = 1500;       // Pause duration between ticks in milliseconds
    const totalEmails = emails.length;

    // 2. Loop through emails using chunk increments
    for (let i = 0; i < totalEmails; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      console.log(`[WORKER] Processing chunk ${Math.floor(i / chunkSize) + 1} (${i + 1} to ${Math.min(i + chunkSize, totalEmails)} of ${totalEmails})`);

      // Process chunk elements in parallel to optimize CPU utilization
      await Promise.all(
        chunk.map(async (email) => {
          let session = null;
          try {
            // Establish an isolated transaction session for database atomic safety
            session = await mongoose.startSession();
            session.startTransaction();

            // A. Generate unique public identifiers and cryptographic tokens
            const { public_code, secure_token } = GiftCard.generateSecureTokens();
            
            // B. Calculate expiry date based on batch configuration
            const expiry_date = new Date();
            expiry_date.setDate(expiry_date.getDate() + batch.expiry_days);

            // C. Create Gift Card inside session
            // Admin ID is mapped to sender_user_id for validation schema compliance
            const cardArray = await GiftCard.create(
              [
                {
                  public_code,
                  secure_token,
                  type: 'gift',
                  amount: batch.gift_card_amount,
                  remaining_balance: batch.gift_card_amount,
                  sender_user_id: batch.sender_admin_id,
                  recipient_email: email,
                  status: 'invited',
                  expiry_date,
                  message: batch.message
                }
              ],
              { session }
            );

            const card = cardArray[0];

            // D. Create Gift Card Invite Link inside session
            const inviteToken = GiftCardInvite.generateUrlSafeToken();
            const tokenExpiry = new Date();
            tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Active link for 7 days

            await GiftCardInvite.create(
              [
                {
                  gift_card_id: card._id,
                  invite_token: inviteToken,
                  recipient_email: email,
                  token_expires_at: tokenExpiry
                }
              ],
              { session }
            );

            // E. Create Transaction Ledger entry inside session
            await GiftCardTransaction.create(
              [
                {
                  gift_card_id: card._id,
                  transaction_type: 'purchase',
                  amount: batch.gift_card_amount,
                  performed_by_user_id: batch.sender_admin_id,
                  description: `Bulk Distribution: ${batch.campaign_name}`
                }
              ],
              { session }
            );

            // Commit all database operations atomically
            await session.commitTransaction();
            session.endSession();
            session = null; // Clear session reference

            // F. Send invite email with default corporate brand name: "Trip to Honeymoon"
            await sendGiftCardInviteEmail(
              email,
              batch.gift_card_amount,
              'Trip to Honeymoon', // Enforce corporate default sender
              inviteToken
            );

          } catch (itemError) {
            console.error(`[WORKER] Failed to process email: ${email} ->`, itemError);
            
            // Abort the active database transaction if initialized
            if (session) {
              await session.abortTransaction();
              session.endSession();
            }

            // Log individual failed item in the batch database log
            await GiftCardBatch.findByIdAndUpdate(batchId, {
              $push: {
                failed_records: {
                  email,
                  reason: itemError.message || 'Database write or SMTP error'
                }
              }
            });

          } finally {
            // Always increment processed counter (keeps progress bars accurate)
            await GiftCardBatch.findByIdAndUpdate(batchId, {
              $inc: { processed_records: 1 }
            });
          }
        })
      );

      // Throttling step: Avoid flooding SMTP ports or throttling database locks
      if (i + chunkSize < totalEmails) {
        console.log(`[WORKER] Throttling active. Pausing for ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }

    // 3. Campaign Finalization & Audit
    const finalBatch = await GiftCardBatch.findById(batchId);
    if (finalBatch) {
      const isFailedCampaign = finalBatch.failed_records.length === finalBatch.total_records;
      finalBatch.status = isFailedCampaign ? 'failed' : 'completed';
      await finalBatch.save();
      console.log(`[WORKER] Campaign completed successfully. Status: ${finalBatch.status}. Processed: ${finalBatch.processed_records}/${finalBatch.total_records}. Failures: ${finalBatch.failed_records.length}`);
    }

  } catch (globalError) {
    console.error(`[WORKER] Fatal error in processBulkGiftCards:`, globalError);
    // Mark campaign as failed due to system crash
    await GiftCardBatch.findByIdAndUpdate(batchId, { status: 'failed' });
  }
};
