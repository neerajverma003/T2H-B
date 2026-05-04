import mongoose from 'mongoose';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import imageGalleryModel from './src/models/imageGallery.model.js';
import { ENV } from './src/config/ENV.js';
import dotenv from 'dotenv';
dotenv.config();

const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const galleries = await imageGalleryModel.find();
      let totalRemoved = 0;

      for (let gallery of galleries) {
        let validImages = [];
        let modified = false;

        for (let key of gallery.image) {
          if (!key) continue;
          
          if (key.startsWith('http')) {
            validImages.push(key);
            continue;
          }

          try {
            const command = new HeadObjectCommand({
              Bucket: ENV.AWS_S3_BUCKET_NAME,
              Key: key,
            });
            await s3Client.send(command);
            validImages.push(key);
          } catch (err) {
            console.log(`Removing broken key: ${key} (${err.name})`);
            modified = true;
            totalRemoved++;
          }
        }

        if (modified) {
          gallery.image = validImages;
          await gallery.save();
          console.log(`Saved gallery for destination: ${gallery.destination_id}`);
        }
      }
      
      console.log(`Successfully removed ${totalRemoved} broken images from the database.`);
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  })
  .catch(console.error);
