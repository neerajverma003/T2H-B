import mongoose from 'mongoose';
import crypto from 'crypto';

const giftCardInviteSchema = new mongoose.Schema({
  gift_card_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GiftCard', 
    required: true,
    unique: true 
  },
  
  // The secure token embedded in the URL sent to recipient
  invite_token: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  
  // Validation layer: Person clicking the link MUST have this email
  recipient_email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending'
  },
  
  // Time limits for security
  token_expires_at: { type: Date, required: true },
  
  // Audit trail for when and who accepted it
  accepted_at: { type: Date },
  accepted_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Crypto helper to generate complex URL-safe token
giftCardInviteSchema.statics.generateUrlSafeToken = function() {
  return crypto.randomBytes(48).toString('hex');
};

const GiftCardInvite = mongoose.model('GiftCardInvite', giftCardInviteSchema);
export default GiftCardInvite;
