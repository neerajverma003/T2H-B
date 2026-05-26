import mongoose from 'mongoose';
import userModel from '../models/user.model.js';
import GiftCard from '../models/giftCard.model.js';
import GiftCardInvite from '../models/giftCardInvite.model.js';
import GiftCardTransaction from '../models/giftCardTransaction.model.js';
import { ENV } from '../config/ENV.js';

async function run() {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const giftCards = await GiftCard.find({}).populate('sender_user_id', 'firstName email').populate('accepted_by_user_id', 'firstName email');
    console.log('Total Gift Cards:', giftCards.length);
    giftCards.forEach(c => {
      console.log(`- ID: ${c._id}, Code: ${c.public_code}, Type: ${c.type}, Status: ${c.status}, Amount: ${c.amount}, Remaining: ${c.remaining_balance}, Sender: ${c.sender_user_id?.email || 'N/A'}, Accepted By: ${c.accepted_by_user_id?.email || 'N/A'}, Expiry: ${c.expiry_date}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
