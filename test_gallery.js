import mongoose from 'mongoose';
import imageGalleryModel from './src/models/imageGallery.model.js';
import dotenv from 'dotenv';
import { processGalleryImages } from './src/controller/admin/imageGallery.controller.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const galleries = await imageGalleryModel.find().limit(1);
      const processed = await processGalleryImages(galleries[0]);
      console.log(JSON.stringify(processed, null, 2));
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  })
  .catch(console.error);
