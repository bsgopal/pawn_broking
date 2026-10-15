import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect } from '../middleware/auth.js';
import { generateRepaymentVoucherHtml } from '../utils/pawnTicketGenerator.js';
import { sendPawnWhatsAppNotification } from '../utils/whatsappNotifier.js';

const router = express.Router();

// @desc    Get Repayment Ledger History
// @route   GET /api/repayments
router.get('/', protect, async (req, res) => {
  try {
    const { loanId, customerId, limit = 100, page = 1 } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Repayment = getTenantModel(tenantCode, 'Repayment');

    const query = {};
    if (loanId) query.loanId = loanId;
    if (customerId) query.customerId = customerId;

    const skip = (Number(page) - 1) * Number(limit);
    const [repayments, total] = await Promise.all([
      Repayment.find(query).sort({ paymentDate: -1 }).skip(skip).limit(Number(limit)),
      Repayment.countDocuments(query)
    ]);

    res.json({ success: true, count: repayments.length, total, repayments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Process Interest / Principal Repayment
// @route   POST /api/repayments
router.post('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const Repayment = getTenantModel(tenantCode, 'Repayment');
    const Customer = getTenantModel(tenantCode, 'Customer');
    const DayBook = getTenantModel(tenantCode, 'DayBook');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');

    const {
      loanId,
      paymentType = 'INTEREST_ONLY', // INTEREST_ONLY, PART_PRINCIPAL, RENEWAL_EXTENSION
      principalPaid = 0,
      interestPaid = 0,
      penaltyPaid = 0,
      discountOrWaiver = 0,
      paymentMode = 'CASH',
      referenceNo = '',
      newMaturityDate,
      remarks = ''
    } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const pPaid = Number(principalPaid) || 0;
    const iPaid = Number(interestPaid) || 0;
    const penPaid = Number(penaltyPaid) || 0;
    const totalPaid = pPaid + iPaid + penPaid;

    if (totalPaid <= 0) {
      return res.status(400).json({ success: false, message: 'Total payment amount must be greater than zero.' });
    }

    const year = new Date().getFullYear();
    const rctCount = await Repayment.countDocuments();
    const receiptNumber = `RCT-${year}-${String(rctCount + 1).padStart(4, '0')}`;

    const newPrincipalBalance = Math.max(0, loan.principalOutstanding - pPaid);
    const paymentDate = new Date();

    const repayment = await Repayment.create({
      receiptNumber,
      loanId: loan._id,
      ticketNumber: loan.ticketNumber,
      customerId: loan.customerId,
      customerName: loan.customerName,
      branchCode: req.user?.branchCode || loan.branchCode,
      paymentDate,
      paymentType,
      principalPaid: pPaid,
      interestPaid: iPaid,
      penaltyPaid: penPaid,
      discountOrWaiver: Number(discountOrWaiver) || 0,
      totalPaid,
      principalBalanceRemaining: newPrincipalBalance,
      interestCoveredUptoDate: paymentDate,
      newMaturityDate: newMaturityDate ? new Date(newMaturityDate) : loan.maturityDate,
      paymentMode,
      referenceNo,
      receivedBy: req.user?.name || 'Cashier',
      remarks
    });

    // Update Loan Record
    loan.principalOutstanding = newPrincipalBalance;
    loan.interestCollected = (loan.interestCollected || 0) + iPaid;
    loan.penaltyCollected = (loan.penaltyCollected || 0) + penPaid;
    loan.lastPaymentDate = paymentDate;

    if (paymentType === 'RENEWAL_EXTENSION' && newMaturityDate) {
      loan.maturityDate = new Date(newMaturityDate);
      loan.renewalCount = (loan.renewalCount || 0) + 1;
      loan.lastRenewalDate = paymentDate;
      loan.status = 'Active';
    }

    await loan.save();

    // Update Customer Outstanding
    if (pPaid > 0) {
      await Customer.findByIdAndUpdate(loan.customerId, {
        $inc: { totalPrincipalOutstanding: -pPaid }
      });
    }

    // Record in DayBook
    const todayStr = paymentDate.toISOString().split('T')[0];
    await DayBook.findOneAndUpdate(
      { date: todayStr },
      {
        $inc: {
          totalInterestCollectedCash: paymentMode === 'CASH' ? iPaid + penPaid : 0,
          totalInterestCollectedBank: paymentMode !== 'CASH' ? iPaid + penPaid : 0,
          totalPrincipalRecoveredCash: paymentMode === 'CASH' ? pPaid : 0,
          totalPrincipalRecoveredBank: paymentMode !== 'CASH' ? pPaid : 0
        },
        $push: {
          transactions: {
            time: new Date(),
            type: pPaid > 0 ? 'PRINCIPAL_RECEIPT' : 'INTEREST_RECEIPT',
            referenceNumber: receiptNumber,
            partyName: loan.customerName,
            amount: totalPaid,
            mode: paymentMode === 'CASH' ? 'CASH' : 'BANK',
            handledBy: req.user?.name || 'Cashier'
          }
        }
      },
      { upsert: true }
    );

    // Audit log
    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Cashier',
      action: 'COLLECT_PAYMENT',
      details: `Collected ₹${totalPaid.toLocaleString('en-IN')} (Principal: ₹${pPaid}, Interest: ₹${iPaid}) for loan ${loan.ticketNumber} [Receipt: ${receiptNumber}]`,
      targetId: receiptNumber
    });

    const shopConfig = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() }) || {};

    // Send WhatsApp receipt notification asynchronously
    sendPawnWhatsAppNotification({
      customerCode: tenantCode,
      customerMobile: loan.customerMobile,
      customerName: loan.customerName,
      eventType: 'PAYMENT_RECEIVED',
      data: {
        ticketNumber: loan.ticketNumber,
        receiptNumber,
        amount: totalPaid,
        remainingPrincipal: newPrincipalBalance,
        shopName: shopConfig.shopName
      }
    });

    // Generate Printable Receipt HTML
    const receiptHtml = generateRepaymentVoucherHtml(repayment, shopConfig);

    res.status(201).json({
      success: true,
      message: `Payment of ₹${totalPaid.toLocaleString('en-IN')} processed successfully.`,
      repayment,
      receiptHtml
    });
  } catch (error) {
    console.error('[Repayment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Process Master-Governed Partial Gold Collateral Release
// @route   POST /api/repayments/partial-release
router.post('/partial-release', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const Repayment = getTenantModel(tenantCode, 'Repayment');
    const Customer = getTenantModel(tenantCode, 'Customer');
    const DayBook = getTenantModel(tenantCode, 'DayBook');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');

    const {
      loanId,
      releasedItemIndices = [], // array of item indexes [0, 2]
      principalPaid = 0,
      interestPaid = 0,
      paymentMode = 'CASH',
      referenceNo = '',
      otpVerified = true,
      managerPin = '',
      remarks = ''
    } = req.body;

    const shopConfig = await ShopConfig.findOne({}) || {};
    
    // Check if Partial Release is licensed
    if (shopConfig.featurePermissions && shopConfig.featurePermissions.allowPartialRelease === false) {
      return res.status(403).json({
        success: false,
        message: 'Partial Gold Release Desk is locked. Please upgrade license in Renic Soft Master HQ.'
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (!Array.isArray(releasedItemIndices) || releasedItemIndices.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one ornament to release.' });
    }

    const pPaid = Number(principalPaid) || 0;
    const iPaid = Number(interestPaid) || 0;
    const totalPaid = pPaid + iPaid;

    if (totalPaid <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount required for partial collateral release.' });
    }

    const year = new Date().getFullYear();
    const rctCount = await Repayment.countDocuments();
    const releaseVoucherNo = `PRV-${year}-${String(rctCount + 1).padStart(4, '0')}`;
    const releaseDate = new Date();

    let releasedGrossWt = 0;
    let releasedNetWt = 0;
    const releasedItemNames = [];

    releasedItemIndices.forEach(idx => {
      if (loan.items[idx]) {
        loan.items[idx].released = true;
        loan.items[idx].releasedAt = releaseDate;
        loan.items[idx].releaseVoucherNo = releaseVoucherNo;
        releasedGrossWt += Number(loan.items[idx].grossWeight || 0);
        releasedNetWt += Number(loan.items[idx].netWeight || 0);
        releasedItemNames.push(`${loan.items[idx].ornamentType} (${loan.items[idx].netWeight}g)`);
      }
    });

    const newPrincipalBalance = Math.max(0, loan.principalOutstanding - pPaid);
    const remainingItems = loan.items.filter(it => !it.released);
    const remainingGrossWt = remainingItems.reduce((sum, it) => sum + (it.grossWeight || 0), 0);
    const remainingNetWt = remainingItems.reduce((sum, it) => sum + (it.netWeight || 0), 0);
    const remainingValuation = remainingItems.reduce((sum, it) => sum + (it.valuationAmount || 0), 0);

    // Update Loan Record
    loan.principalOutstanding = newPrincipalBalance;
    loan.totalGrossWt = remainingGrossWt;
    loan.totalNetWt = remainingNetWt;
    loan.marketValuationTotal = remainingValuation;
    loan.maxEligibleLoan = Math.round(remainingValuation * ((loan.eligibleCollateralPct || 75) / 100));
    loan.interestCollected = (loan.interestCollected || 0) + iPaid;
    loan.lastPaymentDate = releaseDate;
    loan.status = remainingItems.length === 0 ? 'Redeemed' : 'Partially_Released';

    loan.partialReleaseHistory.push({
      releaseDate,
      releasedItems: releasedItemNames,
      releasedGrossWt,
      releasedNetWt,
      principalPaid: pPaid,
      interestPaid: iPaid,
      remainingPrincipal: newPrincipalBalance,
      remainingGrossWt,
      remainingNetWt,
      receiptNumber: releaseVoucherNo,
      otpVerified: Boolean(otpVerified)
    });

    await loan.save();

    // Create Repayment Record
    const repayment = await Repayment.create({
      receiptNumber: releaseVoucherNo,
      loanId: loan._id,
      ticketNumber: loan.ticketNumber,
      customerId: loan.customerId,
      customerName: loan.customerName,
      branchCode: req.user?.branchCode || loan.branchCode,
      paymentDate: releaseDate,
      paymentType: 'PART_PRINCIPAL',
      principalPaid: pPaid,
      interestPaid: iPaid,
      totalPaid,
      principalBalanceRemaining: newPrincipalBalance,
      paymentMode,
      referenceNo,
      receivedBy: req.user?.name || 'Cashier',
      remarks: `Partial Gold Release: Released [${releasedItemNames.join(', ')}]. ${remarks}`
    });

    // Update Customer Outstanding
    if (pPaid > 0) {
      await Customer.findByIdAndUpdate(loan.customerId, {
        $inc: { totalPrincipalOutstanding: -pPaid }
      });
    }

    // Record in DayBook
    const todayStr = releaseDate.toISOString().split('T')[0];
    await DayBook.findOneAndUpdate(
      { date: todayStr },
      {
        $inc: {
          totalInterestCollectedCash: paymentMode === 'CASH' ? iPaid : 0,
          totalInterestCollectedBank: paymentMode !== 'CASH' ? iPaid : 0,
          totalPrincipalRecoveredCash: paymentMode === 'CASH' ? pPaid : 0,
          totalPrincipalRecoveredBank: paymentMode !== 'CASH' ? pPaid : 0
        },
        $push: {
          transactions: {
            time: new Date(),
            type: 'PARTIAL_RELEASE_RECEIPT',
            referenceNumber: releaseVoucherNo,
            partyName: loan.customerName,
            amount: totalPaid,
            mode: paymentMode === 'CASH' ? 'CASH' : 'BANK',
            handledBy: req.user?.name || 'Cashier'
          }
        }
      },
      { upsert: true }
    );

    // Audit Log
    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Cashier',
      action: 'PARTIAL_GOLD_RELEASE',
      details: `Processed Partial Release for loan ${loan.ticketNumber}. Released ${releasedItemNames.length} items (${releasedNetWt}g net). Principal Paid: ₹${pPaid}, Remaining: ₹${newPrincipalBalance}. Voucher: ${releaseVoucherNo}`,
      targetId: releaseVoucherNo
    });

    res.status(201).json({
      success: true,
      message: `Partial collateral release of ${releasedItemNames.length} ornament(s) completed successfully.`,
      releaseVoucherNo,
      repayment,
      loan
    });
  } catch (error) {
    console.error('[Partial Release Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
