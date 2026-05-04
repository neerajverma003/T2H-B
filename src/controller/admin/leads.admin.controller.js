import contactModel from '../../models/contact.model.js';
import suggestionComplainModel from '../../models/suggestionComplain.model.js';
import subscribeModel from '../../models/subscribe.model.js';
import planYourTrip from '../../models/planYourTrip.model.js';

// --- Contact Inquiries ---
export const getContacts = async (req, res) => {
  try {
    const data = await contactModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, Data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    await contactModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Suggestions/Complaints ---
export const getSuggestions = async (req, res) => {
  try {
    const data = await suggestionComplainModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, Data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSuggestion = async (req, res) => {
  try {
    await suggestionComplainModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Consultation Leads (Reusing PlanYourTrip model filtered by consultation=true) ---
export const getConsultationLeads = async (req, res) => {
  try {
    const data = await planYourTrip.find({ consultation: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, Data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Subscriptions ---
export const getSubscribes = async (req, res) => {
  try {
    const data = await subscribeModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, Data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubscribe = async (req, res) => {
  try {
    await subscribeModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
