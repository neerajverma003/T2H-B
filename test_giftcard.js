import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const checkGC = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.useDb('trip_to_honeymoon'); 
    const collection = mongoose.connection.collection('giftcards');
    const gc = await collection.findOne({ public_code: 'T2H-CB9471' });
    console.log(gc);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
};
checkGC();
