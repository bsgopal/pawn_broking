import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get Current Live Metal Market Rates
// @route   GET /api/rates
router.get('/', async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const MetalRate = getTenantModel(tenantCode, 'MetalRate');

    const todayStr = new Date().toISOString().split('T')[0];
    let currentRate = await MetalRate.findOne({ date: todayStr });

    if (!currentRate) {
      // Find latest available rate
      currentRate = await MetalRate.findOne().sort({ date: -1 });
    }

    if (!currentRate) {
      // Seed initial rate
      currentRate = await MetalRate.create({
        date: todayStr,
        gold22K: 6850,
        gold24K: 7450,
        gold18K: 5600,
        silver: 92,
        platinum: 3600,
        updatedBy: 'System Default',
        history: [{ date: todayStr, gold22K: 6850, gold24K: 7450, gold18K: 5600, silver: 92, platinum: 3600 }]
      });
    }

    const history = await MetalRate.find().sort({ date: -1 }).limit(30);

    res.json({
      success: true,
      current: {
        date: currentRate.date,
        gold22K: currentRate.gold22K,
        gold24K: currentRate.gold24K,
        gold18K: currentRate.gold18K || 5600,
        silver: currentRate.silver,
        platinum: currentRate.platinum || 3600,
        updatedBy: currentRate.updatedBy,
        updatedAt: currentRate.updatedAt
      },
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Daily Metal Market Rates
// @route   POST /api/rates
router.post('/', protect, authorize('ADMIN', 'MANAGER', 'VALUER'), async (req, res) => {
  try {
    const { gold22K, gold24K, gold18K, silver, platinum, date } = req.body;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const MetalRate = getTenantModel(tenantCode, 'MetalRate');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const targetDate = date || new Date().toISOString().split('T')[0];

    const rate = await MetalRate.findOneAndUpdate(
      { date: targetDate },
      {
        $set: {
          date: targetDate,
          gold22K: Number(gold22K),
          gold24K: Number(gold24K),
          gold18K: Number(gold18K) || (Number(gold22K) * 0.82),
          silver: Number(silver),
          platinum: Number(platinum) || 3600,
          updatedBy: req.user?.name || 'Manager'
        },
        $push: {
          history: {
            date: targetDate,
            gold22K: Number(gold22K),
            gold24K: Number(gold24K),
            gold18K: Number(gold18K) || (Number(gold22K) * 0.82),
            silver: Number(silver),
            platinum: Number(platinum) || 3600
          }
        }
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Manager',
      action: 'UPDATE_METAL_RATES',
      details: `Updated Daily Rates: Gold 22K ₹${gold22K}/g, Gold 24K ₹${gold24K}/g, Silver ₹${silver}/g`,
      targetId: targetDate
    });

    res.json({ success: true, message: 'Market rates updated successfully', rate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
