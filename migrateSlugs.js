import mongoose from 'mongoose';
import DestinationModel from './src/models/destinationInternationAndDomestic.model.js';
import { generateSlug } from './src/utils.js';

const runMigration = async () => {
  await mongoose.connect('mongodb+srv://DBt2h:N2wi16082002@t2h.othrcon.mongodb.net/trip_to_honeymoon?retryWrites=true&w=majority&appName=T2H');
  
  const destinations = await DestinationModel.find({ slug: { $exists: false } });
  console.log(`Found ${destinations.length} destinations missing slugs.`);

  for (let dest of destinations) {
    dest.slug = generateSlug(dest.destination_name);
    await dest.save();
    console.log(`Migrated: ${dest.destination_name} -> ${dest.slug}`);
  }
  
  console.log("Migration Complete!");
  process.exit();
};

runMigration(); 