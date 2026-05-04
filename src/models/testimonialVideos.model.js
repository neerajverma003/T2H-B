import mongoose from 'mongoose';

const videoTestimonialSchema = new mongoose.Schema(
  {
    video_url: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    visibility: {
      type: String,
      default: 'public',
    },
    location:{
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    }
  },
  {
    timestamps: true
  }
);

const VideoTestimonial = mongoose.model('VideoTestimonial', videoTestimonialSchema);

export default VideoTestimonial;
