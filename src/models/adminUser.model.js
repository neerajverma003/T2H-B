import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique:true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'subadmin'],
    default:'admin'
  },
},{timestamps:true});

const AdminModel = mongoose.model('AdminSchema', AdminSchema);

export default AdminModel;


