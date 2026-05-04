import mongoose from 'mongoose';

const imageGalleryScheam = new mongoose.Schema(
  {
    // Accept string destination IDs like 'HONEYMOON' for easier admin uploads and testing
    destination_id: {
      type: String,
      unique: true,
      required: true,
    },
    image: [String],
  },
  { timestamps: true }
);

const imageGalleryModel = mongoose.model('imageGallery', imageGalleryScheam);
export default imageGalleryModel;
