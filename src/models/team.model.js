import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
    },
    image: {
      type: String, // S3 file secure URL store hoga 
      required: [true, "Profile image is required"],
    },
    socialLinks: {
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    status: {
      type: Boolean,
      default: true, // true mtlb website par dikhega, false mtlb hidden
    },
    order: {
      type: Number,
      default: 0, // sequence handle karne ke liye
    },
  },
  { timestamps: true } // Auto create "createdAt" and "updatedAt"
);

const Team = mongoose.model("Team", teamSchema);
export default Team;
