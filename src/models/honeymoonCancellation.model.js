import mongoose from 'mongoose';

const honeymoonPolicySchema = new mongoose.Schema({
  honeymoon_cancellation_policy: { type: String, default: '' },
});

const HoneymoonPolicyModel = mongoose.model('HoneymoonCancellationPolicy', honeymoonPolicySchema);
export default HoneymoonPolicyModel;
