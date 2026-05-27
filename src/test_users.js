import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from './models/user.model.js';

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI;
console.log('Using MONGO_URI:', MONGO_URI ? 'RESOLVED FROM .ENV' : 'NOT FOUND');

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('CONNECTED TO DB successfully.');
    
    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    const totalCount = await userModel.countDocuments({});
    console.log('Total User count in database:', totalCount);
    
    const sampleUsers = await userModel.find({}, 'firstName lastName email').limit(5);
    console.log('Sample Users:', sampleUsers);
    
    process.exit(0);
  } catch (error) {
    console.error('Error connecting or querying:', error);
    process.exit(1);
  }
}

check();
