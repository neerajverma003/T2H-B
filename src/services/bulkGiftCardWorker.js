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
import { sendGiftCardInviteEmail, sendGiftCardReminderEmail } from '../utils/email.js';

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

export const processBulkReminders = async (batchId, selectedEmails, customMessage) => {
  console.log(`[WORKER] Initiating bulk reminders for Batch: ${batchId} with ${selectedEmails.length} recipients`);
  
  try {
    const chunkSize = 10;
    const delayMs = 1500;
    const totalEmails = selectedEmails.length;

    for (let i = 0; i < totalEmails; i += chunkSize) {
      const chunk = selectedEmails.slice(i, i + chunkSize);
      
      await Promise.all(
        chunk.map(async (email) => {
          try {
            // Find the gift card associated with this email and batch
            // Wait, we need to find the gift card where recipient_email === email or accepted_by_user_id.email === email
            // The batch only saves emails_list. But GiftCard was created with recipient_email = email.
            const card = await GiftCard.findOne({ recipient_email: email, status: { $nin: ['redeemed', 'expired', 'revoked', 'cancelled'] }, remaining_balance: { $gt: 0 } });
            
            if (!card) {
               console.log(`[WORKER] Skipping email ${email} - No active eligible gift card found.`);
               return;
            }

            // Check spam protection (last_reminded_at)
            const now = new Date();
            if (card.last_reminded_at) {
              const hoursSinceLastReminder = (now - card.last_reminded_at) / (1000 * 60 * 60);
              if (hoursSinceLastReminder < 48) {
                console.log(`[WORKER] Skipping email ${email} - Reminded within 48 hours.`);
                return;
              }
            }

            const invite = await GiftCardInvite.findOne({ gift_card_id: card._id });
            const token = invite ? invite.invite_token : null;

            // Send Email
            const emailSent = await sendGiftCardReminderEmail(
              email,
              card.amount,
              customMessage,
              token,
              card.public_code,
              card.expiry_date
            );

            if (emailSent) {
               // Update last_reminded_at
               card.last_reminded_at = now;
               await card.save();
            }

          } catch (itemError) {
            console.error(`[WORKER] Failed to process reminder for email: ${email} ->`, itemError);
          }
        })
      );

      if (i + chunkSize < totalEmails) {
        await sleep(delayMs);
      }
    }
    console.log(`[WORKER] Bulk reminders completed for Batch: ${batchId}`);
  } catch (globalError) {
    console.error(`[WORKER] Fatal error in processBulkReminders:`, globalError);
  }
};

export const processBulkRemindersByCardIds = async (cardIds, customMessage) => {
  console.log(`[WORKER] Initiating bulk reminders for ${cardIds.length} selected cards`);
  
  try {
    const chunkSize = 10;
    const delayMs = 1500;
    const totalCards = cardIds.length;

    for (let i = 0; i < totalCards; i += chunkSize) {
      const chunk = cardIds.slice(i, i + chunkSize);
      
      await Promise.all(
        chunk.map(async (cardId) => {
          try {
            const card = await GiftCard.findById(cardId);
            
            if (!card || ['redeemed', 'expired', 'revoked', 'cancelled'].includes(card.status) || card.remaining_balance <= 0) {
               console.log(`[WORKER] Skipping card ${cardId} - Not eligible.`);
               return;
            }

            // Find target email
            let targetEmail = card.recipient_email;
            if (card.accepted_by_user_id) {
               const populatedCard = await GiftCard.findById(cardId).populate('accepted_by_user_id', 'email');
               if (populatedCard.accepted_by_user_id) {
                   targetEmail = populatedCard.accepted_by_user_id.email;
               }
            }

            if (!targetEmail) return;

            // Check spam protection (last_reminded_at)
            const now = new Date();
            if (card.last_reminded_at) {
              const hoursSinceLastReminder = (now - card.last_reminded_at) / (1000 * 60 * 60);
              if (hoursSinceLastReminder < 48) {
                console.log(`[WORKER] Skipping email ${targetEmail} - Reminded within 48 hours.`);
                return;
              }
            }

            const invite = await GiftCardInvite.findOne({ gift_card_id: card._id });
            const token = invite ? invite.invite_token : null;

            // Send Email
            const emailSent = await sendGiftCardReminderEmail(
              targetEmail,
              card.amount,
              customMessage,
              token,
              card.public_code,
              card.expiry_date
            );

            if (emailSent) {
               card.last_reminded_at = now;
               await card.save();
            }

          } catch (itemError) {
            console.error(`[WORKER] Failed to process reminder for card: ${cardId} ->`, itemError);
          }
        })
      );

      if (i + chunkSize < totalCards) {
        await sleep(delayMs);
      }
    }
    console.log(`[WORKER] Bulk reminders completed for selected cards`);
  } catch (globalError) {
    console.error(`[WORKER] Fatal error in processBulkRemindersByCardIds:`, globalError);
  }
};
