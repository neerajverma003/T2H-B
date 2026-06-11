import mongoose from 'mongoose';

const itineraryBookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itinerary_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItineraryMain',
      required: true,
    },
    travel_date: {
      type: Date,
      required: true,
    },
    adults: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    kids: {
      type: Number,
      default: 0,
    },
    total_price: {
      type: Number,
      required: true,
    },
    token_amount_paid: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'partial_paid', 'paid', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['payment_pending', 'confirmed', 'cancelled', 'completed'],
      default: 'payment_pending',
    },
    razorpay_order_id: {
      type: String,
    },
    razorpay_payment_id: {
      type: String,
    },
    payment_type: {
      type: String,
      enum: ['full', 'token'],
      default: 'full',
    },
    notes: {
      type: String,
      trim: true,
    },
    used_gift_card_code: {
      type: String,
      default: null,
    },
    voucher_amount_used: {
      type: Number,
      default: 0,
    },
    wallet_amount_used: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

const itineraryBookingModel = mongoose.model('ItineraryBooking', itineraryBookingSchema);
export default itineraryBookingModel;
