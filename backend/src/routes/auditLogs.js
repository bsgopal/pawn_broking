import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get Security & Staff Audit Logs
// @route   GET /api/audit-logs
router.get('/', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { action, limit = 100, page = 1 } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const query = {};
    if (action && action !== 'ALL') query.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({ success: true, count: logs.length, total, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
