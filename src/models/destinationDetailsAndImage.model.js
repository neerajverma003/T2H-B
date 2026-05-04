import mongoose from 'mongoose';

const destinationDetailsAndImageSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
      default: [],
    },
    domestic_or_international: {
      type: String,
      enum: ['domestic', 'international'],
      required: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    destination_type: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);
const DestinationDetailsAndImage = mongoose.model(
  'DestinationDetailsAndImage',
  destinationDetailsAndImageSchema
);
export default DestinationDetailsAndImage;
