import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';

const router = express.Router();

// @desc    OTA Push License & Screen Governance receiver from Renic Soft
// @route   POST /api/v1/license/sync
router.post('/sync', async (req, res) => {
  try {
    const {
      customerCode,
      clientName,
      planTier,
      licenseStatus,
      licenseStart,
      licenseEnd,
      screenPermissions,
      clientId,
      clientSecret
    } = req.body;

    const code = (customerCode || req.customerCode || getCurrentTenantCode()).toUpperCase();
    const ShopConfig = getTenantModel(code, 'ShopConfig');
    const Client = getTenantModel(code, 'Client');

    console.log(`[OTA Push Received] Synchronizing license settings for customer [${code}]`);

    await ShopConfig.updateOne(
      { customerCode: code },
      {
        $set: {
          shopName: clientName || code,
          customerCode: code,
          screenPermissions: screenPermissions || {},
          oauthConfig: {
            clientId: clientId || '',
            clientSecret: clientSecret || '',
            verified: true,
            lastVerifiedAt: new Date()
          }
        }
      },
      { upsert: true }
    );

    await Client.updateOne(
      { customerCode: code },
      {
        $set: {
          name: clientName || code,
          customerCode: code,
          planTier: planTier || 'pro',
          licenseStatus: licenseStatus || 'active',
          licenseStart: licenseStart ? new Date(licenseStart) : new Date(),
          licenseEnd: licenseEnd ? new Date(licenseEnd) : null,
          screenPermissions: screenPermissions || {},
          clientId: clientId || '',
          clientSecret: clientSecret || ''
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `OTA License synchronization complete for customer [${code}]`
    });
  } catch (error) {
    console.error('[OTA Push Sync Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Screen permissions push from Renic Soft
// @route   POST /api/tenant/sync-push
router.post('/sync-push', async (req, res) => {
  try {
    const { customerCode, screenPermissions, clientName } = req.body;
    const code = (customerCode || req.customerCode || getCurrentTenantCode()).toUpperCase();
    const ShopConfig = getTenantModel(code, 'ShopConfig');

    await ShopConfig.updateOne(
      { customerCode: code },
      {
        $set: {
          screenPermissions: screenPermissions || {},
          shopName: clientName || code
        }
      },
      { upsert: true }
    );

    res.json({ success: true, message: `Screen permissions synced for ${code}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
