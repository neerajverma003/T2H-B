import mongoose from "mongoose";

const consultationLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
      default: null,
    },
    itineraryTitle: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ConsultationLead =
  mongoose.models.ConsultationLead ||
  mongoose.model("ConsultationLead", consultationLeadSchema);

export default ConsultationLead;
