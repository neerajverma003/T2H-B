import mongoose from 'mongoose';

const subscribeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  archive: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const subscribeModel = mongoose.model('subscribeSchema', subscribeSchema);

export default subscribeModel;
