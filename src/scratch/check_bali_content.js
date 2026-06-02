import mongoose from 'mongoose';
import { ENV } from '../config/ENV.js';
import Blog from '../models/blog.model.js';

async function check() {
  await mongoose.connect(ENV.MONGO_URI);
  const b = await Blog.findById("6a1d665d8902a577c1243c14");
  console.log("Bali content:");
  console.log(b.content);
  await mongoose.disconnect();
}

check();
