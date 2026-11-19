// backend/src/utils/auditLogger.js
const { query } = require('../config/db');

async function logAudit({ userId = null, action, entityType, entityId = null, details = null, ipAddress = null }) {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    await query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, detailsJson, ipAddress]
    );
  } catch (err) {
    console.error('Audit Log Error (non-blocking):', err.message);
  }
}

module.exports = {
  logAudit
};

