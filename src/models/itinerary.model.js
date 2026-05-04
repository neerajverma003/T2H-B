import mongoose from 'mongoose';

// Sub-schema for days_information
const dayInfoSchema = new mongoose.Schema(
  {
    day: { type: String, trim: true },
    locationName: { type: String, trim: true },
    locationDetail: { type: String, trim: true },
  },
  { _id: false }
);

// Main schema
const itinerarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    itinerary_visibility: {
      type: String,
      enum: ['public', 'private'],
      required: true,
    },
    itinerary_type: {
      type: String,
      enum: ['fixed', 'flexible'],
      required: true,
    },
    cancellation_policy: {
      type: String,
      // required: true,
      trim: true,
    },
    classification: {
      type: [String],
      required: true,
    },
    days_information: {
      type: [dayInfoSchema],
      required: true,
    },
    destination_detail: {
      type: String,
      required: true,
      trim: true,
    },
    destination_images: {
      type: [String],
      required: true,
    },
    destination_thumbnails: {
      type: [String],
      // required: true,
    },
    destination_video: {
      type: String, // Store the Cloudinary video URL
      // required: true,
      trim: true,
    },
    discount: {
      type: String,
      // required: true,
      trim: true,
    },
    duration: {
      type: String,
      // required: true,
      trim: true,
    },
    exclusion: {
      type: String,
      // required: true,
      trim: true,
    },
    hotel_as_per_category: {
      type: String,
      // required: true,
      trim: true,
    },
    inclusion: {
      type: String,
      // required: true,
      trim: true,
    },
    itinerary_theme: {
      type: [String],
      // required: true,
    },
    payment_mode: {
      type: String,
      // required: true,
      trim: true,
    },
    pricing: {
      type: mongoose.Schema.Types.Mixed,
      default: 'As per the destination',
      validate: {
        validator: function (value) {
          if (typeof value === 'string') {
            return value === 'As per the destination';
          }
          if (
            typeof value === 'object' &&
            value !== null &&
            typeof value.standard_price === 'number' &&
            typeof value.discounted_price === 'number'
          ) {
            return true;
          }
          return false;
        },
        message:
          "Pricing must be either 'As per the destination' or an object with both standard_price and discounted_price (as numbers).",
      },
    },

    selected_destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DestinationInternationAndDomestic',
      required: true,
    },
    terms_and_conditions: {
      type: String,
      // required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const itineraryModel = mongoose.model('ItineraryMain', itinerarySchema);
export default itineraryModel;
