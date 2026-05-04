import mongoose, { Schema } from 'mongoose';

const resortSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    price_per_night: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    average_rating: {
      type: Number,
      default: 0,
    },
    review_count: {
      type: Number,
      default: 0,
    },
    number_of_ratings: {
      type: Number,
      default: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    discount: {
      type: Number,
      default: 0,
    },
    check_in_time: {
      type: String,
    },
    check_out_time: {
      type: String,
    },
    availability_status: {
      type: String,
      enum: ['Available', 'Unavailable', 'Booked'],
      default: 'Available',
    },
    activities: {
      type: [String],
      default: [],
    },
    policies: {
      type: String,
    },
    contact_email: {
      type: String,
    },
    contact_phone: {
      type: String,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Resort', resortSchema);
