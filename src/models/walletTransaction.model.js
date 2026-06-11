import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
    },
    transaction_type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference_id: {
      type: String, // e.g. Booking ID, Refund ID
      default: null
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('WalletTransaction', walletTransactionSchema);
