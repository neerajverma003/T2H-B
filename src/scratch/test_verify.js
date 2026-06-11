import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import GiftCard from '../models/giftCard.model.js';
import GiftCardInvite from '../models/giftCardInvite.model.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the latest gift card
    const latestGC = await GiftCard.findOne().sort({ created_at: -1 });
    console.log("Latest Gift Card:", latestGC);

    if (latestGC) {
      const invite = await GiftCardInvite.findOne({ gift_card_id: latestGC._id });
      console.log("Associated Invite:", invite);
    }
  } catch (err) {
    console.error("Error in scratch test:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
