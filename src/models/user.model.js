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
    referral_code: {
      type: String,
      unique: true,
      sparse: true,
    },
    referred_by: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.is_verified && !this.referral_code && this.firstName) {
    let code;
    let exists = true;
    while (exists) {
      const prefix = this.firstName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'T2H';
      const suffix = Math.floor(1000 + Math.random() * 9000);
      code = `${prefix}${suffix}`;
      const found = await mongoose.models.User.findOne({ referral_code: code });
      if (!found) {
        exists = false;
      }
    }
    this.referral_code = code;
  }
  next();
});

const userModel = mongoose.model('User', userSchema);

export default userModel;
