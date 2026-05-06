import mongoose from 'mongoose';
import { ENV } from './ENV.js';

const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully ✅');
  } catch (error) {
    console.log("Something Error");
    
    console.log(error);
    process.exit(1);
  }
};
export default connectDB;
