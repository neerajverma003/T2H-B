import ItineraryLead from '../models/itineraryLead.model.js';

// Create a new itinerary lead
export const createItineraryLead = async (req, res) => {
  try {
    const { name, email, phone, state, city, itineraryId, itineraryTitle } = req.body;

    if (!name || !email || !phone || !itineraryId) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide name, email, phone and itinerary information'
      });
    }

    const newLead = new ItineraryLead({
      name,
      email,
      phone,
      state,
      city,
      itineraryId,
      itineraryTitle
    });

    await newLead.save();

    res.status(201).json({
      success: true,
      msg: 'Booking request submitted successfully',
      data: newLead
    });
  } catch (error) {
    console.error('Error in createItineraryLead:', error);
    res.status(500).json({
      success: false,
      msg: 'Internal Server Error',
      error: error.message
    });
  }
};

// Get all itinerary leads (for admin)
export const getAllItineraryLeads = async (req, res) => {
  try {
    const leads = await ItineraryLead.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: leads
    });
  } catch (error) {
    console.error('Error in getAllItineraryLeads:', error);
    res.status(500).json({
      success: false,
      msg: 'Internal Server Error',
      error: error.message
    });
  }
};

// Delete a lead
export const deleteItineraryLead = async (req, res) => {
  try {
    const { id } = req.params;
    await ItineraryLead.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      msg: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteItineraryLead:', error);
    res.status(500).json({
      success: false,
      msg: 'Internal Server Error',
      error: error.message
    });
  }
};
