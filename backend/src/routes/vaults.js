import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all Vault Compartments with items count & status
// @route   GET /api/vaults
router.get('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Vault = getTenantModel(tenantCode, 'Vault');
    const Loan = getTenantModel(tenantCode, 'Loan');

    const vaults = await Vault.find().sort({ vaultName: 1, compartmentNo: 1 });

    // Compute active pledged weights in vault
    const activeLoans = await Loan.find({ status: { $in: ['Active', 'Overdue', 'Partially_Released', 'Notice_Form1', 'Notice_Form2'] } });
    const totalPledgedGoldGrams = activeLoans.reduce((acc, l) => acc + (l.totalNetWt || 0), 0);
    const totalPledgedValuation = activeLoans.reduce((acc, l) => acc + (l.marketValuationTotal || 0), 0);

    // Enrich each vault box with its real-time stored loan packets
    const enrichedVaults = vaults.map(v => {
      const boxLoans = activeLoans.filter(l => 
        (l.vaultId === v.vaultName || (!l.vaultId && v.vaultName === 'Main Vault Safe A')) &&
        Number(l.compartmentNo) === Number(v.compartmentNo)
      );
      const totalGrossWt = boxLoans.reduce((sum, l) => sum + (l.totalGrossWt || 0), 0);
      const totalNetWt = boxLoans.reduce((sum, l) => sum + (l.totalNetWt || 0), 0);
      const totalValuation = boxLoans.reduce((sum, l) => sum + (l.marketValuationTotal || 0), 0);
      const totalPrincipal = boxLoans.reduce((sum, l) => sum + (l.principalOutstanding || l.principal || 0), 0);

      return {
        ...v.toObject(),
        currentItems: boxLoans.length,
        currentOccupancyCount: boxLoans.length,
        totalGrossWt: Number(totalGrossWt.toFixed(3)),
        totalNetWt: Number(totalNetWt.toFixed(3)),
        totalValuation,
        totalPrincipal,
        loans: boxLoans.map(l => ({
          _id: l._id,
          ticketNumber: l.ticketNumber,
          customerId: l.customerId,
          customerName: l.customerName,
          customerMobile: l.customerMobile,
          customerPhotoUrl: l.customerPhotoUrl,
          principal: l.principal,
          principalOutstanding: l.principalOutstanding || l.principal,
          loanDate: l.loanDate,
          maturityDate: l.maturityDate,
          totalGrossWt: l.totalGrossWt,
          totalNetWt: l.totalNetWt,
          marketValuationTotal: l.marketValuationTotal,
          status: l.status,
          itemCount: (l.items || []).length,
          itemsSummary: (l.items || []).map(it => `${it.quantity || 1}x ${it.ornamentType} (${it.grossWeight}g)`).join(', ')
        }))
      };
    });

    res.json({
      success: true,
      count: enrichedVaults.length,
      vaults: enrichedVaults,
      summary: {
        totalCompartments: vaults.length,
        totalCapacity: vaults.reduce((acc, v) => acc + (v.capacity || 15), 0),
        totalItemsOccupied: activeLoans.length,
        totalPledgedGoldGrams: Number(totalPledgedGoldGrams.toFixed(3)),
        totalPledgedValuation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new Vault Compartment(s) or new Vault Safe
// @route   POST /api/vaults
router.post('/', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Vault = getTenantModel(tenantCode, 'Vault');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const {
      vaultName = 'Main Vault Safe A',
      numberOfBoxes = 1,
      capacityPerBox = 15,
      securityLevel = 'MAXIMUM',
      branchCode = 'CHN001'
    } = req.body;

    const numBoxes = Math.max(1, Number(numberOfBoxes) || 1);
    const cap = Math.max(1, Number(capacityPerBox) || 15);

    // Find highest compartment number for this vault safe
    const existingVaults = await Vault.find({ vaultName }).sort({ compartmentNo: -1 });
    const startBoxNo = existingVaults.length > 0 ? (existingVaults[0].compartmentNo + 1) : 1;

    const newBoxes = [];
    for (let i = 0; i < numBoxes; i++) {
      const boxNum = startBoxNo + i;
      newBoxes.push({
        vaultName,
        compartmentNo: boxNum,
        boxNo: boxNum,
        capacity: cap,
        currentItems: 0,
        securityLevel,
        temperature: 21.0,
        lastAudited: new Date(),
        loanIds: [],
        branchCode
      });
    }

    const created = await Vault.insertMany(newBoxes);

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Admin',
      action: 'VAULT_CREATE',
      details: `Created ${numBoxes} new compartment box(es) in ${vaultName} with capacity ${cap} each`,
      targetId: vaultName
    });

    res.status(201).json({
      success: true,
      message: `Successfully added ${created.length} compartment box(es) to ${vaultName}`,
      created
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Vault Compartment details
// @route   PUT /api/vaults/:id
router.put('/:id', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Vault = getTenantModel(tenantCode, 'Vault');

    const { capacity, securityLevel, vaultName } = req.body;
    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ success: false, message: 'Vault box not found' });

    if (capacity !== undefined) vault.capacity = Number(capacity);
    if (securityLevel) vault.securityLevel = securityLevel;
    if (vaultName) vault.vaultName = vaultName;

    await vault.save();
    res.json({ success: true, message: 'Vault box updated', vault });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete Empty Vault Compartment
// @route   DELETE /api/vaults/:id
router.delete('/:id', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Vault = getTenantModel(tenantCode, 'Vault');

    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ success: false, message: 'Vault box not found' });

    if (vault.currentItems > 0 || (vault.loanIds && vault.loanIds.length > 0)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete Box #${vault.compartmentNo} as it contains ${vault.currentItems} active gold packet(s). Please transfer or redeem the loans first.`
      });
    }

    await Vault.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Compartment Box #${vault.compartmentNo} removed successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Perform Vault Compartment Audit
// @route   POST /api/vaults/:id/audit
router.post('/:id/audit', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Vault = getTenantModel(tenantCode, 'Vault');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ success: false, message: 'Vault compartment not found' });

    vault.lastAudited = new Date();
    await vault.save();

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Manager',
      action: 'VAULT_AUDIT',
      details: `Physical audit verified for Vault Compartment #${vault.compartmentNo} (${vault.currentItems} packets verified)`,
      targetId: String(vault.compartmentNo)
    });

    res.json({ success: true, message: `Compartment #${vault.compartmentNo} audited successfully`, vault });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
