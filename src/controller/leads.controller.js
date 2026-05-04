import PlanYourJourney from '../models/planYourJourney.model.js';
import contactModel from '../models/contact.model.js';
import subscribeModel from '../models/subscribe.model.js';
import suggestionComplainModel from '../models/suggestionComplain.model.js';
import planYourTrip from '../models/planYourTrip.model.js';
import { addPlan as addPlanToStore } from '../stores/planYourJourneyStore.js';

// planYourJourney controller
export const planYourJourney = async (req, res) => {
  const { name, email, phone, destination } = req.body;

  console.log(req.body);
  try {
    const planYourJourney = new PlanYourJourney({
      name,
      email,
      phone,
      destination,
    });
    await planYourJourney.save();
    res.status(201).json({
      msg: 'Plan Your Journey request submitted successfully',
      success: true,
      data: planYourJourney,
    });
  } catch (error) {
    res.status(500).json({
      msg: 'Internal Server Error',
      error: error.message,
      success: false,
    });
  }
};

// conatct controller
export const contact = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  // console.log(req.body)
  try {
    const newContcat = new contactModel({
      name,
      email,
      subject,
      message,
      phone_no: phone,
    });
    await newContcat.save();

    // Save contact request logic here
    res.status(201).json({
      msg: 'Contact request submitted successfully',
      success: true,
      data: { name, email, subject, message },
    });
  } catch (error) {
    res.status(500).json({
      msg: 'Internal Server Error',
      error: error.message,
      success: false,
    });
  }
};

// subscribe controller

export const subscribe = async (req, res) => {
  const { name, phone, email } = req.body;
  // console.log(req.body);
  try {
    const newSubscribe = new subscribeModel({
      name,
      phone,
      email,
    });
    await newSubscribe.save();
    res.status(201).json({ msg: 'Successfully Subscribed', success: true });
  } catch (error) {
    res.status(500).json({
      msg: 'Internal Server Error',
      error: error.message,
      success: false,
    });
  }
};

// suggestionComplain controller
export const suggestionComplain = async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const newSuggestionComplain = new suggestionComplainModel({
      name,
      email,
      message,
    });
    await newSuggestionComplain.save();
    return res.status(201).json({
      msg: 'Suggestion or Complaint submitted successfully',
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      msg: 'Internal Server Error',
      error: error.message,
      success: false,
    });
  }
};

// planYourTrip controller

export const planYourTripController = async (req, res) => {
  try {
    const {
      name,
      email,
      phone_no,
      from,
      to,
      NumberodDays,
      adults,
      kids,
      budget,
      purpose,
      consultation,
    } = req.body;

    // 1. Save to MongoDB for persistence
    const newTripPlan = new planYourTrip({
      name,
      email,
      phone_no,
      from,
      to,
      NumberodDays,
      adults,
      kids,
      budget,
      purpose,
      consultation,
    });
    await newTripPlan.save();

    // 2. Keep the in-memory store for real-time admin updates if needed
    addPlanToStore(newTripPlan.toObject());

    console.log('✅ PlanYourTrip saved to MongoDB:', newTripPlan._id);

    return res.status(201).json({
      msg: 'Plan Your Trip request submitted successfully',
      success: true,
      data: newTripPlan,
    });
  } catch (error) {
    console.error('Error in planYourTripController:', error);
    res.status(500).json({
      msg: 'Internal Server Error',
      error: error.message,
      success: false,
    });
  }
};
