import mongoose from 'mongoose';

const planYourTripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone_no: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      default: '',
    },
    to: {
      type: String,
      default: '',
    },
    NumberodDays: {
      type: Number,
      default: 0,
    },
    adults: {
      type: Number,
      default: 0,
    },
    kids: {
      type: Number,
      default: 0,
    },
    budget: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      default: '',
    },
    consultation: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const planYourTrip=mongoose.model('PlanYourTrip', planYourTripSchema)

export default planYourTrip;