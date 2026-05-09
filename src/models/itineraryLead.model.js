import mongoose from 'mongoose';

const itineraryLeadSchema = new mongoose.Schema(
  {
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
    state: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      required: true,
    },
    itineraryTitle: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

const ItineraryLead = mongoose.model('ItineraryLead', itineraryLeadSchema);

export default ItineraryLead;
