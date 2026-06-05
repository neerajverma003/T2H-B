import PlanYourJourney from '../../models/planYourJourney.model.js';

export const getPlanYourJourneyList = async (req, res) => {
  try {
    const data = await PlanYourJourney.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, Data: data });
  } catch (error) {
    console.error('Error fetching plan your journey list:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deletePlanYourJourney = async (req, res) => {
  try {
    const id = req.params.id;
    await PlanYourJourney.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting plan your journey:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updatePlanYourJourneyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['new', 'in_progress', 'proposal_sent', 'booked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updated = await PlanYourJourney.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    return res.status(200).json({ success: true, data: updated, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating journey request status:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
