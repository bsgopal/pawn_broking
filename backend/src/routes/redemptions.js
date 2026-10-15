import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect } from '../middleware/auth.js';
import { sendPawnWhatsAppNotification } from '../utils/whatsappNotifier.js';

const router = express.Router();

// @desc    Get all completed Redemptions
// @route   GET /api/redemptions
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Redemption = getTenantModel(tenantCode, 'Redemption');

    const skip = (Number(page) - 1) * Number(limit);
    const [redemptions, total] = await Promise.all([
      Redemption.find().sort({ redemptionDate: -1 }).skip(skip).limit(Number(limit)),
      Redemption.countDocuments()
    ]);

    res.json({ success: true, count: redemptions.length, total, redemptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Process Full Loan Redemption and Release Collateral
// @route   POST /api/redemptions
router.post('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const Redemption = getTenantModel(tenantCode, 'Redemption');
    const Customer = getTenantModel(tenantCode, 'Customer');
    const Vault = getTenantModel(tenantCode, 'Vault');
    const DayBook = getTenantModel(tenantCode, 'DayBook');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');

    const {
      loanId,
      principalSettled,
      interestSettled,
      penaltySettled = 0,
      waiverAmount = 0,
      totalAmountSettled,
      paymentMode = 'CASH',
      referenceNo = '',
      customerSignProof = '',
      remarks = ''
    } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status === 'Redeemed') {
      return res.status(400).json({ success: false, message: 'This loan is already redeemed and closed.' });
    }

    const year = new Date().getFullYear();
    const redCount = await Redemption.countDocuments();
    const redemptionNumber = `RED-${year}-${String(redCount + 1).padStart(4, '0')}`;
    const redemptionDate = new Date();

    const redemption = await Redemption.create({
      redemptionNumber,
      loanId: loan._id,
      ticketNumber: loan.ticketNumber,
      customerId: loan.customerId,
      customerName: loan.customerName,
      customerMobile: loan.customerMobile,
      branchCode: req.user?.branchCode || loan.branchCode,
      redemptionDate,
      principalSettled: Number(principalSettled) || loan.principalOutstanding,
      interestSettled: Number(interestSettled) || 0,
      penaltySettled: Number(penaltySettled) || 0,
      waiverAmount: Number(waiverAmount) || 0,
      totalAmountSettled: Number(totalAmountSettled),
      paymentMode,
      referenceNo,
      ornamentsHandedOver: true,
      verifiedGrossWeight: loan.totalGrossWt,
      verifiedNetWeight: loan.totalNetWt,
      vaultClearedCompartment: loan.compartmentNo,
      customerSignProof,
      handedOverBy: req.user?.name || 'Vault Officer',
      dischargedBy: req.user?.name || 'Branch Manager',
      remarks
    });

    // Mark Loan as Redeemed and Outstanding = 0
    loan.status = 'Redeemed';
    loan.principalOutstanding = 0;
    loan.lastPaymentDate = redemptionDate;
    await loan.save();

    // Release Customer Active Exposure
    await Customer.findByIdAndUpdate(loan.customerId, {
      $inc: {
        activeLoansCount: -1,
        totalPrincipalOutstanding: -(loan.principalOutstanding || loan.principal)
      }
    });

    // Decrement Vault Occupancy
    await Vault.findOneAndUpdate(
      { compartmentNo: loan.compartmentNo },
      {
        $inc: { currentItems: -1 },
        $pull: { loanIds: loan.ticketNumber }
      }
    );

    // Record in DayBook
    const todayStr = redemptionDate.toISOString().split('T')[0];
    const pAmt = Number(principalSettled) || loan.principal;
    const iAmt = (Number(interestSettled) || 0) + (Number(penaltySettled) || 0);

    await DayBook.findOneAndUpdate(
      { date: todayStr },
      {
        $inc: {
          totalPrincipalRecoveredCash: paymentMode === 'CASH' ? pAmt : 0,
          totalPrincipalRecoveredBank: paymentMode !== 'CASH' ? pAmt : 0,
          totalInterestCollectedCash: paymentMode === 'CASH' ? iAmt : 0,
          totalInterestCollectedBank: paymentMode !== 'CASH' ? iAmt : 0
        },
        $push: {
          transactions: {
            time: new Date(),
            type: 'REDEMPTION',
            referenceNumber: redemptionNumber,
            partyName: loan.customerName,
            amount: Number(totalAmountSettled),
            mode: paymentMode === 'CASH' ? 'CASH' : 'BANK',
            handledBy: req.user?.name || 'Staff'
          }
        }
      },
      { upsert: true }
    );

    // Audit Log
    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Manager',
      action: 'REDEEM_LOAN',
      details: `Redeemed and discharged loan ${loan.ticketNumber}. Returned ${loan.totalNetWt}g gold to ${loan.customerName}. [Redemption: ${redemptionNumber}]`,
      targetId: redemptionNumber
    });

    const shopConfig = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() }) || {};

    // Send WhatsApp notification
    sendPawnWhatsAppNotification({
      customerCode: tenantCode,
      customerMobile: loan.customerMobile,
      customerName: loan.customerName,
      eventType: 'REDEMPTION_DISCHARGE',
      data: {
        ticketNumber: loan.ticketNumber,
        redemptionNumber,
        netWeight: loan.totalNetWt,
        shopName: shopConfig.shopName
      }
    });

    res.status(201).json({
      success: true,
      message: `Loan ${loan.ticketNumber} redeemed successfully. Collateral ornaments released.`,
      redemption
    });
  } catch (error) {
    console.error('[Redemption Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
