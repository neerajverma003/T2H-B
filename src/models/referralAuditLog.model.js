import mongoose from 'mongoose';

const referralAuditLogSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['AUTO_FREEZE', 'MANUAL_FREEZE', 'MANUAL_UNFREEZE', 'VELOCITY_WARNING'],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    referralCountIn24h: {
      type: Number,
      required: true,
    },
    triggeredBySystem: {
      type: Boolean,
      default: true,
    },
    adminUser: {
      type: String, // E.g., admin email if manually actioned
      default: null,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const ReferralAuditLog = mongoose.model('ReferralAuditLog', referralAuditLogSchema);

export default ReferralAuditLog;
