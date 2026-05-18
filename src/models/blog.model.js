import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title:{
    type:String,
    required:true
  },
  cover_image:{
    type:String,
    required:true
  },
  visibility:{
    type:String,
    enum:['Public', 'Private'],
    required:true
  },
  content:{
    type:String,
    required:true
  },
  category: {
    type : String,
    enum: ['honeymoon']
  },
  post_type: {
    type: String,
    enum: ['blog', 'article'],
    default: 'blog'
  }
},{timestamps:true});

export default mongoose.model('Blog', blogSchema);
