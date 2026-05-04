import mongoose from 'mongoose';

const globalSettingsSchema = new mongoose.Schema(
  {
    supportEmail: { type: String, default: "info@gmail.com" },
    supportPhone: { type: String, default: "+91 11 4061 2834" },
    officeAddress: { type: String, default: "New Delhi, India" },
    facebookUrl: { type: String, default: "#" },
    instagramUrl: { type: String, default: "#" },
    twitterUrl: { type: String, default: "#" },
  },
  { timestamps: true }
);

const GlobalSettingsModel = mongoose.model('GlobalSetting', globalSettingsSchema);

export default GlobalSettingsModel;
