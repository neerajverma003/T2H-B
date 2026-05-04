import mongoose from 'mongoose';
import itineraryModel from './src/models/itinerary.model.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const items = await itineraryModel.find({});
  console.log("Items:", JSON.stringify(items, null, 2));
  process.exit(0);
});
