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
