import AuditLog from '../models/auditLog.model.js';
import AdminModel from '../models/adminUser.model.js';

/**
 * Logs an administrative action to the database.
 * @param {Object} data - The log data.
 * @param {string} data.adminId - The ID of the admin performing the action.
 * @param {string} [data.adminName] - The name of the admin (optional, will be fetched if missing).
 * @param {string} data.action - The action type (CREATE, UPDATE, DELETE).
 * @param {string} data.module - The module name.
 * @param {string} data.details - A brief description of what was changed.
 * @param {string} [data.targetId] - The ID of the affected resource.
 * @param {string} [data.ipAddress] - The IP address of the admin.
 */
export const logActivity = async ({ adminId, adminName, action, module, details, targetId, ipAddress }) => {
  try {
    let finalName = adminName;
    if (!finalName && adminId) {
      const admin = await AdminModel.findById(adminId);
      finalName = admin ? admin.username : 'Unknown Admin';
    }

    const log = new AuditLog({
      adminId,
      adminName: finalName || 'Unknown Admin',
      action,
      module,
      details,
      targetId,
      ipAddress
    });
    await log.save();
    console.log(`[AuditLog] ${action} on ${module} by ${finalName}: ${details}`);
  } catch (err) {
    console.error('Failed to save audit log:', err);
  }
};
