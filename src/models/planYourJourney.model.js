import mongoose from 'mongoose';

const planYourJourneySchema = new mongoose.Schema({
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
  destination: {
    type: String,
    required: true,
  },
  archive:{
    type:Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'proposal_sent', 'booked'],
    default: 'new',
  }
},{timestamps:true});

const PlanYourJourney = mongoose.model('PlanYourJourney', planYourJourneySchema);

export default PlanYourJourney;
