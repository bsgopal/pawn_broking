import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all Print Templates
// @route   GET /api/print-templates
router.get('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const PrintTemplate = getTenantModel(tenantCode, 'PrintTemplate');

    let templates = await PrintTemplate.find();
    if (templates.length === 0) {
      templates = await PrintTemplate.insertMany([
        {
          templateType: 'pawn_receipt',
          name: 'Standard 3-Inch Thermal Pawn Pledge Slip',
          format: 'thermal_80mm',
          showOrnamentDetails: true,
          showInterestTerms: true,
          showBarcode: true,
          isDefault: true
        },
        {
          templateType: 'repayment_receipt',
          name: 'Thermal Repayment & Interest Voucher',
          format: 'thermal_80mm',
          showOrnamentDetails: false,
          showInterestTerms: true,
          showBarcode: false,
          isDefault: true
        },
        {
          templateType: 'redemption_receipt',
          name: 'Full Redemption Discharge Certificate',
          format: 'a4_standard',
          showOrnamentDetails: true,
          showInterestTerms: false,
          showBarcode: true,
          isDefault: true
        }
      ]);
    }

    res.json({ success: true, count: templates.length, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Save/Update Print Template
// @route   POST /api/print-templates
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { templateType, name, format, headerHtml, footerHtml, customCss } = req.body;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const PrintTemplate = getTenantModel(tenantCode, 'PrintTemplate');

    const template = await PrintTemplate.findOneAndUpdate(
      { templateType },
      {
        $set: {
          name: name || `${templateType} template`,
          format: format || 'thermal_80mm',
          headerHtml: headerHtml || '',
          footerHtml: footerHtml || '',
          customCss: customCss || ''
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Print template updated successfully', template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
