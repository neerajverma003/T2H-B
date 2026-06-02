import mongoose from 'mongoose';
import { ENV } from '../config/ENV.js';
import Blog from '../models/blog.model.js';

async function check() {
  await mongoose.connect(ENV.MONGO_URI);
  console.log("Connected to MongoDB");
  const blogs = await Blog.find({});
  console.log(`Found ${blogs.length} blogs/articles:`);
  for (const b of blogs) {
    console.log(`- ID: ${b._id}, Title: "${b.title}", PostType: "${b.post_type}", Category: "${b.category}"`);
  }
  await mongoose.disconnect();
}

check();
