import paymentModeModel from '../../models/paymentMode.model.js';
import termsAndConditionModel from '../../models/terms&Condition.model.js';
import HoneymoonPolicyModel from '../../models/honeymoonCancellation.model.js';

// GET /admin/payment-mode/:type
export const getPaymentMode = async (req, res) => {
  const { type } = req.params;
  try {
    if (!type) return res.status(400).json({ success: false, message: 'Type required' });
    const doc = await paymentModeModel.findOne({ destination_type: { $regex: `^${type}$`, $options: 'i' } });
    return res.status(200).json({ success: true, destinationPaymentModeData: { payment_mode: doc?.payment_mode || '' } });
  } catch (err) {
    console.error('Get Payment Mode Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /admin/honeymoon/payment-mode/:type (admin UI)
export const getHoneymoonPaymentMode = async (req, res) => {
  const { type } = req.params;
  try {
    if (!type) return res.status(400).json({ success: false, message: 'Type required' });
    const doc = await paymentModeModel.findOne({ destination_type: { $regex: `^${type}$`, $options: 'i' } });
    return res.status(200).json({ success: true, destinationPaymentModeData: { honeymoon_payment_mode: doc?.payment_mode || '' } });
  } catch (err) {
    console.error('Get Honeymoon Payment Mode Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /admin/honeymoon/payment-mode (create/update)
export const postHoneymoonPaymentMode = async (req, res) => {
  const { type, honeymoon_payment_mode } = req.body;
  try {
    if (!type) return res.status(400).json({ success: false, message: 'Type required' });
    const updated = await paymentModeModel.findOneAndUpdate(
      { destination_type: { $regex: `^${type}$`, $options: 'i' } },
      { destination_type: type, payment_mode: honeymoon_payment_mode || '' },
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, message: 'Saved', data: updated });
  } catch (err) {
    console.error('Save Honeymoon Payment Mode Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /admin/tnc/:destinationId
export const getTncByDestination = async (req, res) => {
  const { destinationId } = req.params;
  try {
    if (!destinationId) return res.status(400).json({ success: false, message: 'destinationId required' });
    const tnc = await termsAndConditionModel.findOne({ destination_name: destinationId });
    return res.status(200).json({ success: true, tnc: tnc || null });
  } catch (err) {
    console.error('Get TNC Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /admin/tnc (body: { destinationId, terms_And_condition })
export const patchTnc = async (req, res) => {
  const { destinationId, terms_And_condition } = req.body;
  try {
    if (!destinationId || typeof terms_And_condition !== 'string') return res.status(400).json({ success: false, message: 'destinationId and terms required' });
    const updated = await termsAndConditionModel.findOneAndUpdate(
      { destination_name: destinationId },
      { destination_name: destinationId, terms_And_condition },
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Patch TNC Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Honeymoon cancellation policy endpoints (simple document store)
// GET /admin/honeymoon-cancellation-policy
export const getHoneymoonCancellationPolicy = async (req, res) => {
  try {
    const doc = await HoneymoonPolicyModel.findOne();
    return res.status(200).json({ success: true, data: { honeymoon_cancellation_policy: doc?.honeymoon_cancellation_policy || 'Standard honeymoon cancellation policy applies.' } });
  } catch (err) {
    console.error('Get Honeymoon Cancellation Policy Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /admin/honeymoon-cancellation-policy
export const putHoneymoonCancellationPolicy = async (req, res) => {
  const { honeymoon_cancellation_policy } = req.body;
  try {
    const doc = await HoneymoonPolicyModel.findOneAndUpdate({}, { honeymoon_cancellation_policy: honeymoon_cancellation_policy || '' }, { upsert: true, new: true });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('Put Honeymoon Cancellation Policy Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Global Terms & Conditions (replacing destination-specific ones)
import GlobalTncModel from '../../models/globalTnc.model.js';

export const getGlobalTnc = async (req, res) => {
  const { type } = req.query; // domestic or international
  try {
    const doc = await GlobalTncModel.findOne({ type: type || 'domestic' });
    return res.status(200).json({ success: true, data: doc || { terms_And_condition: "", type: type || 'domestic' } });
  } catch (err) {
    console.error('Get Global TNC Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateGlobalTnc = async (req, res) => {
  const { terms_And_condition, type } = req.body;
  if (!type) return res.status(400).json({ success: false, message: 'Type is required' });
  
  try {
    const doc = await GlobalTncModel.findOneAndUpdate(
      { type }, 
      { terms_And_condition: terms_And_condition || '' }, 
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('Update Global TNC Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
