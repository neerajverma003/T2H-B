import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import userModel from '../models/user.model.js';
import { generateToken } from '../utils.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const user = await userModel.findById('6a0d9ae305cdc38fd314e7e0');
    console.log("User:", user);

    if (user) {
      const token = generateToken(user._id);
      console.log("Generated Token:", token);
      console.log("Auth State Object:");
      console.log(JSON.stringify({
        state: {
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile_number: user.mobile_number
          }
        },
        version: 0
      }));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
