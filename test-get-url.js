import { getPresignedViewUrl } from './src/controller/admin/s3.controller.js';
import mongoose from 'mongoose';
import { ENV } from './src/config/ENV.js';

async function test() {
  const key = "destinations/1777544223826-Facelessphoto.jpg";
  const url = await getPresignedViewUrl(key);
  console.log("Signed URL:", url);
  process.exit(0);
}
test();
