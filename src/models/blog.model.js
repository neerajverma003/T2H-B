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
  }
},{timestamps:true});

export default mongoose.model('Blog', blogSchema);
