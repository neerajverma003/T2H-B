import mongoose from 'mongoose';
import crypto from 'crypto';

const giftCardSchema = new mongoose.Schema({
  // Security & Identification
  public_code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  secure_token: { type: String, required: true, unique: true }, // Internal high-entropy token

  type: { type: String, enum: ['self', 'gift'], required: true },

  // Balances
  amount: { type: Number, required: true },
  remaining_balance: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  
  // Actor Relations
  sender_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_email: { type: String, trim: true, lowercase: true }, // Mandatory if type === 'gift'
  recipient_name: { type: String, trim: true },
  message: { type: String },

  // Final Ownership (Null until accepted)
  accepted_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Exact statuses matching PRD
  status: {
    type: String,
    enum: [
      'created', 
      'paid', 
      'invited', 
      'pending_signup_or_login', 
      'verified', 
      'accepted', 
      'active', 
      'redeemed', 
      'expired', 
      'revoked', 
      'cancelled'
    ],
    default: 'created'
  },
  
  // Payment tracking integration
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },

  expiry_date: { type: Date, required: true },
  
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Mongoose Helper Method: Generate secure tokens
giftCardSchema.statics.generateSecureTokens = function() {
  const public_code = `T2H-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const secure_token = crypto.randomBytes(32).toString('hex'); // 64 char string
  return { public_code, secure_token };
};

const GiftCard = mongoose.model('GiftCard', giftCardSchema);
export default GiftCard;
