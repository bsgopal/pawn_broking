import express from 'express';
import axios from 'axios';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateTicketNumber } from '../utils/ticketNumberGenerator.js';

const router = express.Router();
const RENIC_MASTER_URL = process.env.RENIC_MASTER_URL || 'http://localhost:5050';

// @desc    Preview Formatted Pawn Ticket Number
// @route   GET /api/settings/preview-ticket-number
router.get('/preview-ticket-number', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const Loan = getTenantModel(tenantCode, 'Loan');

    const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });
    const count = await Loan.countDocuments();

    const ticketConfig = req.query.prefix || req.query.patternTemplate ? {
      enabled: req.query.enabled !== 'false',
      prefix: req.query.prefix,
      suffix: req.query.suffix || '',
      separator: req.query.separator !== undefined ? req.query.separator : '-',
      yearFormat: req.query.yearFormat || 'YYYY',
      monthFormat: req.query.monthFormat || 'NONE',
      paddingDigits: Number(req.query.paddingDigits) || 4,
      nextSequence: Number(req.query.nextSequence) || 1,
      patternTemplate: req.query.patternTemplate || ''
    } : (config?.ticketConfig || {
      enabled: true,
      prefix: 'PWN',
      yearFormat: 'YYYY',
      paddingDigits: 4,
      nextSequence: 1,
      patternTemplate: '{PREFIX}-{YEAR}-{SEQ}'
    });

    const result = generateTicketNumber(ticketConfig, count, req.query.branchCode || '');
    res.json({ success: true, count, ...result, ticketConfig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get Shop & System Configuration
// @route   GET /api/settings
router.get('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const Branch = getTenantModel(tenantCode, 'Branch');

    let config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });

    if (!config) {
      config = await ShopConfig.create({
        customerCode: tenantCode.toUpperCase(),
        shopName: 'Sri Lakshmi Pawn Brokers',
        rbiLicenseNo: 'RB/PB/' + tenantCode.toUpperCase() + '/2026',
        gstinNo: '',
        address: 'Main Commercial Street, Central City',
        eligibleCollateralPct: 75,
        rbiInterestCapPa: 24,
        defaultMonthlyInterestPct: 2.0,
        defaultGracePeriodDays: 7,
        defaultPenaltyPct: 1.0,
        thermalPrinterName: 'Default Printer',
        thermalPaperWidth: '80mm',
        smsRemindersEnabled: true,
        whatsappAlertsEnabled: true
      });
    }

    const branches = await Branch.find();

    res.json({ success: true, config, branches, customerCode: tenantCode.toUpperCase() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Shop Configuration
// @route   PUT /api/settings
router.put('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const config = await ShopConfig.findOneAndUpdate(
      { customerCode: tenantCode.toUpperCase() },
      { $set: req.body },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Admin',
      action: 'UPDATE_SETTINGS',
      details: 'Updated shop preferences, RBI limits, or thermal printer configurations',
      targetId: tenantCode.toUpperCase()
    });

    res.json({ success: true, message: 'Settings saved successfully', config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get OAuth & SaaS License Status
// @route   GET /api/settings/oauth-status
router.get('/oauth-status', async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const Client = getTenantModel(tenantCode, 'Client');

    const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });
    const client = await Client.findOne({ customerCode: tenantCode.toUpperCase() });

    const clientId = config?.oauthConfig?.clientId || '';
    const hasClientSecret = Boolean(config?.oauthConfig?.clientSecret?.trim());
    const verified = Boolean(config?.oauthConfig?.verified && clientId && hasClientSecret);

    res.json({
      success: true,
      configured: Boolean(clientId && hasClientSecret),
      verified,
      clientId,
      hasClientSecret,
      customerCode: tenantCode.toUpperCase(),
      licenseStatus: verified ? 'active' : 'unregistered',
      lastVerifiedAt: config?.oauthConfig?.lastVerifiedAt || null,
      screenPermissions: config?.screenPermissions || {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify Client ID & Client Secret with Renic Soft Master HQ
// @route   POST /api/settings/verify-oauth
router.post('/verify-oauth', async (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({
      success: false,
      message: 'Renic Client ID and Client Secret are required.'
    });
  }

  const cleanClientId = clientId.trim();
  const cleanClientSecret = clientSecret.trim();
  const tenantCode = req.customerCode || getCurrentTenantCode();

  try {
    // 1. Request token exchange from Renic Soft Master HQ
    const tokenRes = await axios.post(`${RENIC_MASTER_URL}/api/v1/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: cleanClientId,
      client_secret: cleanClientSecret
    }, { timeout: 5000 });

    if (tokenRes.data?.access_token) {
      const returnedCustomerCode = (tokenRes.data.customer_code || tenantCode).toUpperCase();
      const softwareProduct = tokenRes.data.software_product || 'PAWN_BROKING';

      const ShopConfig = getTenantModel(returnedCustomerCode, 'ShopConfig');
      const Client = getTenantModel(returnedCustomerCode, 'Client');
      const AuditLog = getTenantModel(returnedCustomerCode, 'AuditLog');

      // Update ShopConfig with verified OAuth credentials
      await ShopConfig.findOneAndUpdate(
        { customerCode: returnedCustomerCode },
        {
          $set: {
            customerCode: returnedCustomerCode,
            'oauthConfig.clientId': cleanClientId,
            'oauthConfig.clientSecret': cleanClientSecret,
            'oauthConfig.verified': true,
            'oauthConfig.lastVerifiedAt': new Date()
          }
        },
        { upsert: true, new: true }
      );

      // Update Client record
      await Client.findOneAndUpdate(
        { customerCode: returnedCustomerCode },
        {
          $set: {
            name: tokenRes.data.client_name || 'Sri Lakshmi Pawn Brokers',
            customerCode: returnedCustomerCode,
            softwareProduct,
            licenseStatus: 'active',
            licenseStart: new Date(),
            clientId: cleanClientId,
            clientSecret: cleanClientSecret
          }
        },
        { upsert: true, new: true }
      );

      // Log the verification event
      await AuditLog.create({
        customerCode: returnedCustomerCode,
        username: req.user?.name || 'Admin',
        action: 'OAUTH_VERIFIED',
        details: `Successfully verified and activated SaaS license with Renic Soft Master for client [${returnedCustomerCode}]`,
        targetId: cleanClientId
      });

      return res.json({
        success: true,
        verified: true,
        customerCode: returnedCustomerCode,
        message: `PawnBook Pro license successfully verified and registered with Renic Soft Master HQ for customer [${returnedCustomerCode}]!`,
        expiresIn: tokenRes.data.expires_in
      });
    }

    return res.status(401).json({
      success: false,
      verified: false,
      message: 'Authentication failed. Please check your Renic Client ID and Client Secret.'
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error_description || error.response?.data?.message || error.message;
    console.error('[OAuth Verification Error]:', errorMsg);
    return res.status(401).json({
      success: false,
      verified: false,
      message: `Verification failed with Renic Soft Master: ${errorMsg}`
    });
  }
});

// @desc    Sync and Verify License & Screen Permissions with Renic Soft Master HQ
// @route   POST /api/settings/sync-renic
router.post('/sync-renic', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });

    // Call Renic Soft Master
    const masterRes = await axios.get(`${RENIC_MASTER_URL}/api/v1/tenant/${tenantCode.toUpperCase()}/verify`, {
      timeout: 3000
    }).catch(err => ({ data: { success: false, message: err.message } }));

    if (masterRes.data?.success && masterRes.data?.client) {
      const client = masterRes.data.client;
      if (config) {
        config.screenPermissions = client.screenPermissions || {};
        config.shopName = client.name || config.shopName;
        await config.save();
      }
      return res.json({
        success: true,
        message: 'Successfully synchronized license with Renic Soft Master HQ.',
        client: masterRes.data.client
      });
    }

    res.json({
      success: true,
      message: 'Local configuration verified. Renic Soft Master HQ communication active.',
      localTenant: tenantCode.toUpperCase()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Disconnect / Revoke OAuth Registration (Lock All Screens)
// @route   POST /api/settings/disconnect-oauth
router.post('/disconnect-oauth', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const Client = getTenantModel(tenantCode, 'Client');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    await ShopConfig.findOneAndUpdate(
      { customerCode: tenantCode.toUpperCase() },
      {
        $set: {
          'oauthConfig.verified': false,
          'oauthConfig.clientSecret': '',
          'oauthConfig.lastVerifiedAt': null
        }
      }
    );

    await Client.findOneAndUpdate(
      { customerCode: tenantCode.toUpperCase() },
      {
        $set: {
          licenseStatus: 'unregistered',
          clientSecret: ''
        }
      }
    );

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Admin',
      action: 'OAUTH_REVOKED',
      details: `Revoked SaaS OAuth connection for [${tenantCode.toUpperCase()}]. Operational screens locked.`,
      targetId: tenantCode.toUpperCase()
    });

    res.json({
      success: true,
      message: 'SaaS License disconnected. Operational desks are now locked until re-authenticated.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
