/**
 * @file startupRecovery.js
 * @description Self-healing system daemon that runs during server boot lifecycle.
 * Scans for interrupted campaigns (e.g. due to crashes or hot deploys) and auto-resumes them.
 * @module services/startupRecovery
 */

import GiftCardBatch from '../models/giftCardBatch.model.js';
import { processBulkGiftCards } from './bulkGiftCardWorker.js';

/**
 * Audit database on boot lifecycle and auto-resume incomplete bulk distributions.
 */
export const recoverInterruptedBatches = async () => {
  console.log('[RECOVERY] Initializing Startup Recovery Daemon...');
  
  try {
    // 1. Fetch campaigns that were interrupted while 'processing'
    const interruptedBatches = await GiftCardBatch.find({ status: 'processing' });

    if (interruptedBatches.length === 0) {
      console.log('[RECOVERY] Zero interrupted campaigns found. Server state is clean.');
      return;
    }

    console.warn(`[RECOVERY] Found ${interruptedBatches.length} interrupted bulk campaigns! Initiating self-healing...`);

    // 2. Loop through incomplete campaigns and launch background recovery processes
    for (const batch of interruptedBatches) {
      const { _id, campaign_name, emails_list, processed_records } = batch;
      
      console.log(`[RECOVERY] Campaign "${campaign_name}" (${_id}) was at progress ${processed_records}/${emails_list.length}.`);

      // Slice list from the exact pointer index to avoid duplicate deliveries
      const remainingEmails = emails_list.slice(processed_records);

      if (remainingEmails.length > 0) {
        console.log(`[RECOVERY] Resuming delivery for ${remainingEmails.length} remaining recipients...`);
        
        // Trigger background loop asynchronously (Non-blocking worker execution)
        processBulkGiftCards(_id, remainingEmails).catch((err) => {
          console.error(`[RECOVERY] Error during self-healing runtime for Batch ${_id}:`, err);
        });
      } else {
        // Edge-case: If records were technically processed but server crashed before status save
        console.log(`[RECOVERY] All records were already processed for campaign. Marking as completed.`);
        batch.status = 'completed';
        await batch.save();
      }
    }

  } catch (error) {
    console.error('[RECOVERY] Failed to execute startup recovery daemon:', error);
  }
};
