import planYourTrip from '../../models/planYourTrip.model.js';

export const getPlanYourTripList = async (req, res) => {
  try {
    const data = await planYourTrip.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, Data: data });
  } catch (error) {
    console.error('Error fetching detailed trip requests:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deletePlanYourTrip = async (req, res) => {
  try {
    const id = req.params.id;
    await planYourTrip.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Detailed Trip Request Deleted' });
  } catch (error) {
    console.error('Error deleting trip request:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updatePlanYourTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['new', 'in_progress', 'proposal_sent', 'booked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updated = await planYourTrip.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    return res.status(200).json({ success: true, data: updated, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating trip request status:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
