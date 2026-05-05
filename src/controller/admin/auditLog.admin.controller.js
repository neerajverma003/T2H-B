import AuditLog from '../../models/auditLog.model.js';

/**
 * Retrieves all audit logs for the security feed.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(200); // Keep it performant

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    console.error('[AuditLogs] Fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching logs.' });
  }
};
