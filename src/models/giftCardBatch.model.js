/**
 * @file giftCardBatch.model.js
 * @description Mongoose schema for tracking bulk gift card distribution campaigns.
 * Stores the target list, tracks processed progress, and holds error logs for self-healing runs.
 * @module models/giftCardBatch
 */

import mongoose from 'mongoose';

const giftCardBatchSchema = new mongoose.Schema(
  {
    campaign_name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      index: true
    },
    recipient_type: {
      type: String,
      enum: ['registered', 'custom'],
      required: [true, 'Recipient type is required']
    },
    gift_card_amount: {
      type: Number,
      required: [true, 'Gift card amount is required'],
      min: [100, 'Minimum gift card value is ₹100']
    },
    message: {
      type: String,
      trim: true,
      default: 'A special travel credit gift for you!'
    },
    expiry_days: {
      type: Number,
      default: 365, // Valid for 1 year by default
      min: [1, 'Expiry duration must be at least 1 day']
    },
    
    // Status tracking for async loop states
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    
    // Queue and Progress Counters
    emails_list: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Emails list must contain at least one recipient.'
      }
    },
    total_records: {
      type: Number,
      required: true,
      default: 0
    },
    processed_records: {
      type: Number,
      required: true,
      default: 0
    },
    
    // Audit relationships (Superadmin / Admin executing the batch)
    sender_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminSchema',
      required: [true, 'Sender admin reference is required']
    },
    
    // Strict 1-to-1 mapping for exact frontend rendering
    issued_cards: [
      {
        email: { type: String, lowercase: true, trim: true, required: true },
        public_code: { type: String, required: true },
        card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GiftCard', required: true }
      }
    ],
    
    // Detailed error logging for invalid domains, bounces or SMTP failures
    failed_records: [
      {
        email: {
          type: String,
          lowercase: true,
          trim: true,
          required: true
        },
        reason: {
          type: String,
          required: true
        },
        failed_at: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Optimize database queries for campaign list retrieval and monitoring
giftCardBatchSchema.index({ status: 1, created_at: -1 });

const GiftCardBatch = mongoose.model('GiftCardBatch', giftCardBatchSchema);
export default GiftCardBatch;
