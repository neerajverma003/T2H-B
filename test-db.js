import mongoose from 'mongoose';
import { ENV } from './src/config/ENV.js';
import DestinationInternationAndDomesticModel from './src/models/destinationInternationAndDomestic.model.js';

mongoose.connect(ENV.MONGO_URI).then(async () => {
  const docs = await DestinationInternationAndDomesticModel.find().sort({ createdAt: -1 }).limit(2);
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
});
