import mongoose from 'mongoose';

const globalTncSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['domestic', 'international'],
      required: true,
      unique: true
    },
    terms_And_condition: { 
      type: String, 
      required: true,
      default: "Standard Terms & Conditions apply."
    },
  },
  { timestamps: true }
);

const GlobalTncModel = mongoose.model('Global-Tnc', globalTncSchema);

export default GlobalTncModel;
