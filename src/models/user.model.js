import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    mobile_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otp_expiry: {
      type: Date,
      default: null,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    last_login: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model('User', userSchema);

export default userModel;
