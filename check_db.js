import mongoose from 'mongoose';
import { ENV } from './src/config/ENV.js';
import DestinationModel from './src/models/destinationInternationAndDomestic.model.js';

async function check() {
    await mongoose.connect(ENV.MONGO_URI);
    const dest = await DestinationModel.findOne({ destination_name: /Goa/i });
    console.log("Goa Data:", JSON.stringify(dest, null, 2));
    mongoose.disconnect();
}
check();
