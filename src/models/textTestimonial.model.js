import mongoose from 'mongoose';

const textTestimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    travelDate: {
      type: Date,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: 'https://example.com/default-profile.png',
    },
    trip_image: {
      type: [String],
      default: [],
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    toShow: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const textTestimonialModel = mongoose.model('TextTestimonial', textTestimonialSchema);
export default textTestimonialModel;
