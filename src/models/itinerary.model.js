import mongoose from 'mongoose';

// Sub-schema for days_information
const dayInfoSchema = new mongoose.Schema(
  {
    day: { type: String, trim: true },
    locationName: { type: String, trim: true },
    locationDetail: { type: String, trim: true },
    sightseeing: { type: String, trim: true },
    transfer: { type: String, trim: true },
    weather: { type: String, trim: true },
    date: { type: String, trim: true },
    day_image: { type: String, trim: true },
    day_images: { type: [String], default: [] },
  },
  { _id: false }
);

// Sub-schema for reviews / traveler stories
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    message: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    profileImage: { type: String, trim: true },
    isApproved: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
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
      trim: true,
    },
    about_the_tour: {
      type: String,
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
    reviews: {
      type: [reviewSchema],
      default: [],
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
    },
    destination_video: {
      type: String,
      trim: true,
    },
    discount: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    exclusion: {
      type: String,
      trim: true,
    },
    hotel_as_per_category: {
      type: String,
      trim: true,
    },
    inclusion: {
      type: String,
      trim: true,
    },
    itinerary_theme: {
      type: [String],
    },
    payment_mode: {
      type: String,
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
            (value.is_price_on_request === true ||
              (typeof value.standard_price === 'number' && typeof value.discounted_price === 'number'))
          ) {
            return true;
          }
          return false;
        },
        message:
          "Pricing must be 'As per the destination', an object with is_price_on_request, or standard_price/discounted_price.",
      },
    },

    selected_destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DestinationInternationAndDomestic',
      required: true,
    },
    terms_and_conditions: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const itineraryModel = mongoose.model('ItineraryMain', itinerarySchema);
export default itineraryModel;
