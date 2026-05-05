import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adminUser',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'],
    required: true
  },
  module: {
    type: String,
    required: true // e.g. 'ITINERARY', 'DESTINATION', 'RESORT'
  },
  details: {
    type: String,
    required: true // e.g. 'Updated price for Maldives package'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
