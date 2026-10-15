import express from 'express';
import { reportScreenTelemetry } from '../middleware/license.js';

const router = express.Router();

// @desc    Client-side screen visit telemetry logger
// @route   POST /api/telemetry/page-view
router.post('/page-view', async (req, res) => {
  try {
    const { screenPath, actionDetails } = req.body;
    const customerCode = req.customerCode || req.headers['x-customer-code'] || 'renic-pb';
    
    reportScreenTelemetry(customerCode, screenPath, req.user, actionDetails);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

export default router;
