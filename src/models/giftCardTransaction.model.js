import mongoose from 'mongoose';

const giftCardTransactionSchema = new mongoose.Schema({
  gift_card_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GiftCard', 
    required: true,
    index: true
  },
  transaction_type: {
    type: String,
    enum: ['purchase', 'redeem', 'refund', 'expiry_deduction'],
    required: true
  },
  // Positive for addition (purchase/refund), Negative for deduction (redeem)
  amount: { 
    type: Number, 
    required: true 
  },
  // If redeemed against a specific itinerary booking
  booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking' 
  },
  performed_by_user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  description: { 
    type: String, 
    required: true 
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const GiftCardTransaction = mongoose.model('GiftCardTransaction', giftCardTransactionSchema);
export default GiftCardTransaction;
