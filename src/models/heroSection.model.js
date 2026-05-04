import mongoose from 'mongoose';

const mediaItemSchema = mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  media_type: {
    type: String,
    enum: ['video', 'image'],
    default: 'video',
  },
  visibility: {
    type: String,
    enum: ['Public', 'Private'],
    required: true,
  },
});

const heroSectionVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    // Array kept for backward compat but only 1 item is ever stored now
    video_url: {
      type: [mediaItemSchema],
      default: [],
    },
    heading: {
      type: String,
      default: "Majestic Ladakh"
    },
    sub_heading: {
      type: String,
      default: "Explore the breathtaking landscapes of Ladakh, where mountains meet the sky. A perfect getaway for adventure and peace lovers alike."
    },
  },
  { timestamps: true }
);

const heroSectionVideoModel = mongoose.model('Hero-Section', heroSectionVideoSchema);

export default heroSectionVideoModel;
