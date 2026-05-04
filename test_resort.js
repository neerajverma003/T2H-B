import mongoose from 'mongoose';
import Resort from './src/models/resort.model.js';
import { processResortImages } from './src/controller/admin/resortController.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const data = await Resort.find().sort({ createdAt: -1 });
      const processedData = await processResortImages(data);
      console.log("Success! Found:", processedData.length);
    } catch (e) {
      console.error("Error occurred:", e);
    }
    process.exit(0);
  })
  .catch(console.error);
