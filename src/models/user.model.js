import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    mobile_number: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: true,
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
    partnerName: {
      type: String,
      default: '',
      trim: true,
    },
    weddingDate: {
      type: Date,
      default: null,
    },
    preferences: {
      honeymoonVibe: {
        type: String,
        default: '',
      },
      dietaryPreference: {
        type: String,
        default: '',
      },
      departureCity: {
        type: String,
        default: '',
      },
    },
    wallet_balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model('User', userSchema);

export default userModel;
