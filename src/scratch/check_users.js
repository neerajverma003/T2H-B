import mongoose from 'mongoose';
import userModel from '../models/user.model.js';
import { ENV } from '../config/ENV.js';

async function run() {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const users = await userModel.find({});
    console.log('Total users:', users.length);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}, is_verified: ${u.is_verified}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
