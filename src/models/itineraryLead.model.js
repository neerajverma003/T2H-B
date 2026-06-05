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
    travelDate: {
      type: String,
    },
    travelers: {
      type: String,
    },
    budget: {
      type: Number,
    },
    additionalDetails: {
      type: String,
    },
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      required: true,
    },
    itineraryTitle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'proposal_sent', 'booked'],
      default: 'new',
    }
  },
  { timestamps: true }
);

const ItineraryLead = mongoose.model('ItineraryLead', itineraryLeadSchema);

export default ItineraryLead;
