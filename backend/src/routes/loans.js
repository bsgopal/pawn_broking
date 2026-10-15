import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect } from '../middleware/auth.js';
import { calculateLoanInterest, calculateGoldValuation } from '../utils/interestCalculator.js';
import { generatePawnTicketHtml } from '../utils/pawnTicketGenerator.js';
import { sendPawnWhatsAppNotification } from '../utils/whatsappNotifier.js';
import { generateTicketNumber, validateTicketConfig } from '../utils/ticketNumberGenerator.js';

const router = express.Router();

// @desc    Calculate Valuation & Interest Preview
// @route   POST /api/loans/calculate-preview
router.post('/calculate-preview', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const MetalRate = getTenantModel(tenantCode, 'MetalRate');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');

    const [latestRate, shopConfig] = await Promise.all([
      MetalRate.findOne().sort({ date: -1 }),
      ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() })
    ]);

    const live22K = latestRate?.gold22K || 6850;
    const live24K = latestRate?.gold24K || 7450;
    const live18K = latestRate?.gold18K || Math.round(live22K * 0.82);
    const liveSilver = latestRate?.silver || 92;
    const eligibleLtv = shopConfig?.eligibleCollateralPct || 75;

    const { items = [], principal = 0, interestScheme = shopConfig?.defaultInterestScheme || 'MONTHLY_SIMPLE', monthlyRatePct = shopConfig?.defaultMonthlyInterestPct || 2.0, durationMonths = 3 } = req.body;
    
    let totalGrossWt = 0;
    let totalNetWt = 0;
    let marketValuationTotal = 0;

    const evaluatedItems = items.map(it => {
      const gWt = Number(it.grossWeight || 0);
      const sWt = Number(it.stoneWeight || 0);
      let rate = Number(it.marketRatePerGram);
      if (!rate || rate <= 0) {
        if (it.metal === 'Silver') rate = liveSilver;
        else if (it.purity === '24K') rate = live24K;
        else if (it.purity === '18K') rate = live18K;
        else rate = live22K;
      }

      const valRes = calculateGoldValuation({
        grossWeight: gWt,
        stoneWeight: sWt,
        stoneDeductionValue: Number(it.stoneDeductionValue || 0),
        purity: it.purity || '22K',
        marketRate22K: rate,
        eligibleLtvPct: eligibleLtv
      });

      totalGrossWt += valRes.grossWeight;
      totalNetWt += valRes.netWeight;
      marketValuationTotal += valRes.netValuation;

      return {
        ...it,
        grossWeight: valRes.grossWeight,
        netWeight: valRes.netWeight,
        marketRatePerGram: rate,
        valuationAmount: valRes.netValuation
      };
    });

    const maxEligibleLoan = Math.floor((marketValuationTotal * (eligibleLtv / 100)) / 100) * 100;
    const loanPrincipal = Number(principal) || maxEligibleLoan;

    const interestPreview = calculateLoanInterest({
      principal: loanPrincipal,
      interestScheme,
      monthlyRatePct: Number(monthlyRatePct),
      durationMonths: Number(durationMonths),
      gracePeriodDays: shopConfig?.defaultGracePeriodDays || 7,
      penaltyMonthlyPct: shopConfig?.defaultPenaltyPct || 1.0
    });

    res.json({
      success: true,
      evaluatedItems,
      totalGrossWt: Number(totalGrossWt.toFixed(3)),
      totalNetWt: Number(totalNetWt.toFixed(3)),
      marketValuationTotal,
      maxEligibleLoan,
      interestPreview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all loans with filters and pagination
// @route   GET /api/loans
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, customerId, branchCode, limit = 100, page = 1 } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');

    const query = {};
    if (status && status !== 'ALL') {
      if (status === 'OVERDUE') {
        query.status = { $in: ['Overdue', 'Notice_Form1', 'Notice_Form2'] };
      } else {
        query.status = status;
      }
    }
    if (customerId) query.customerId = customerId;
    if (branchCode) query.branchCode = branchCode;

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { packetBarcode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [loans, total] = await Promise.all([
      Loan.find(query).sort({ loanDate: -1 }).skip(skip).limit(Number(limit)),
      Loan.countDocuments(query)
    ]);

    // Compute live interest for active loans
    const loansWithLiveInterest = loans.map(loan => {
      const loanObj = loan.toObject();
      if (loanObj.status === 'Active' || loanObj.status === 'Overdue') {
        const intRes = calculateLoanInterest({
          principal: loanObj.principalOutstanding || loanObj.principal,
          interestScheme: loanObj.interestScheme,
          monthlyRatePct: loanObj.interestPctPerMonth,
          loanDate: loanObj.lastPaymentDate || loanObj.loanDate,
          asOfDate: new Date(),
          durationMonths: loanObj.durationMonths,
          gracePeriodDays: loanObj.gracePeriodDays,
          penaltyMonthlyPct: loanObj.penaltyPct
        });
        loanObj.liveInterestDue = intRes.totalInterest;
        loanObj.liveTotalDue = intRes.totalPayable;
        loanObj.liveOverdueDays = intRes.overdueDays;
      }
      return loanObj;
    });

    res.json({ success: true, count: loansWithLiveInterest.length, total, loans: loansWithLiveInterest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single loan details
// @route   GET /api/loans/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const Repayment = getTenantModel(tenantCode, 'Repayment');
    const Customer = getTenantModel(tenantCode, 'Customer');

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan record not found' });
    }

    const [repayments, customer] = await Promise.all([
      Repayment.find({ loanId: loan._id }).sort({ paymentDate: -1 }),
      Customer.findById(loan.customerId)
    ]);

    const liveCalc = calculateLoanInterest({
      principal: loan.principalOutstanding,
      interestScheme: loan.interestScheme,
      monthlyRatePct: loan.interestPctPerMonth,
      loanDate: loan.lastPaymentDate || loan.loanDate,
      durationMonths: loan.durationMonths,
      gracePeriodDays: loan.gracePeriodDays,
      penaltyMonthlyPct: loan.penaltyPct
    });

    res.json({
      success: true,
      loan: {
        ...loan.toObject(),
        liveCalculation: liveCalc
      },
      customer,
      repayments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Disburse new Pawn Pledge Loan
// @route   POST /api/loans
router.post('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const Customer = getTenantModel(tenantCode, 'Customer');
    const Vault = getTenantModel(tenantCode, 'Vault');
    const DayBook = getTenantModel(tenantCode, 'DayBook');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');

    const {
      customerId,
      customerName,
      customerMobile,
      items = [],
      principal,
      durationMonths = 3,
      interestScheme = 'MONTHLY_SIMPLE',
      interestPctPerMonth = 2.0,
      vaultId = 'Main Vault Safe A',
      compartmentNo = 1,
      boxNo = 1,
      disbursementMode = 'CASH',
      remarks
    } = req.body;

    if (!customerId || !principal || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide customer, items, and loan principal amount.' });
    }

    // 1. Fetch shopConfig & validate Ticket Number Configuration
    const shopConfig = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() }) || {};
    const ticketConfig = shopConfig.ticketConfig || {
      enabled: true,
      prefix: 'PWN',
      yearFormat: 'YYYY',
      paddingDigits: 4,
      nextSequence: 1,
      patternTemplate: '{PREFIX}-{YEAR}-{SEQ}'
    };

    const validation = validateTicketConfig(ticketConfig);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `${validation.message} Without a configured Pawn Ticket Number format in Settings, loans cannot be created.`
      });
    }

    // 2. Generate custom structured ticket number
    const count = await Loan.countDocuments();
    let genResult = generateTicketNumber(ticketConfig, count, req.body.branchCode || '');
    if (!genResult.isValid || !genResult.ticketNumber) {
      return res.status(400).json({
        success: false,
        message: genResult.error || 'Failed to generate Pawn Ticket Number conforming to Settings format.'
      });
    }

    let ticketNumber = genResult.ticketNumber;
    let collisionOffset = 0;
    while (await Loan.findOne({ ticketNumber })) {
      collisionOffset++;
      const nextGen = generateTicketNumber(ticketConfig, count + collisionOffset, req.body.branchCode || '');
      ticketNumber = nextGen.ticketNumber;
      if (collisionOffset > 1000) break;
    }

    // Compute totals from items
    let totalGrossWt = 0;
    let totalNetWt = 0;
    let totalStoneWt = 0;
    const eligibleLtv = shopConfig.eligibleCollateralPct || 75;

    const formattedItems = items.map(it => {
      const gWt = Number(it.grossWeight || 0);
      const sWt = Number(it.stoneWeight || 0);
      const nWt = Math.max(0, gWt - sWt);
      const val = Number(it.valuationAmount || (nWt * Number(it.marketRatePerGram || 6850)));

      totalGrossWt += gWt;
      totalNetWt += nWt;
      totalStoneWt += sWt;
      marketValuationTotal += val;

      return {
        ornamentType: it.ornamentType || 'Gold Jewelry',
        metal: it.metal || 'Gold',
        purity: it.purity || '22K',
        purityPct: it.purityPct || 91.6,
        quantity: Number(it.quantity || 1),
        grossWeight: Number(gWt.toFixed(3)),
        netWeight: Number(nWt.toFixed(3)),
        stoneWeight: Number(sWt.toFixed(3)),
        stoneDeductionValue: Number(it.stoneDeductionValue || 0),
        marketRatePerGram: Number(it.marketRatePerGram || 6850),
        valuationAmount: Math.round(val),
        remarks: it.remarks || ''
      };
    });

    const maxEligibleLoan = Math.floor((marketValuationTotal * (eligibleLtv / 100)) / 100) * 100;
    const loanPrincipal = Number(principal);

    // Calculate maturity date
    const loanDate = new Date();
    const maturityDate = new Date(loanDate);
    maturityDate.setMonth(maturityDate.getMonth() + Number(durationMonths));

    const effectiveMonthlyInterest = Number(interestPctPerMonth) || shopConfig.defaultMonthlyInterestPct || 2.0;

    const newLoan = await Loan.create({
      ticketNumber,
      customerId,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      branchCode: req.user?.branchCode || 'CHN001',
      loanDate,
      maturityDate,
      durationMonths: Number(durationMonths),
      principal: loanPrincipal,
      principalOutstanding: loanPrincipal,
      interestScheme,
      interestPctPerMonth: effectiveMonthlyInterest,
      interestPctPerAnnum: effectiveMonthlyInterest * 12,
      eligibleCollateralPct: eligibleLtv,
      items: formattedItems,
      totalGrossWt: Number(totalGrossWt.toFixed(3)),
      totalNetWt: Number(totalNetWt.toFixed(3)),
      totalStoneWt: Number(totalStoneWt.toFixed(3)),
      marketValuationTotal: Math.round(marketValuationTotal),
      maxEligibleLoan,
      vaultId,
      compartmentNo: Number(compartmentNo),
      boxNo: Number(boxNo),
      packetBarcode: ticketNumber,
      disbursedBy: req.user?.name || 'Counter Staff',
      disbursementMode,
      remarks: remarks || ''
    });

    // Update Customer Exposure & Stats
    await Customer.findByIdAndUpdate(customerId, {
      $inc: {
        totalLoansCount: 1,
        activeLoansCount: 1,
        totalPrincipalDisbursed: loanPrincipal,
        totalPrincipalOutstanding: loanPrincipal
      }
    });

    // Update Vault Compartment Occupancy
    await Vault.findOneAndUpdate(
      { compartmentNo: Number(compartmentNo) },
      {
        $inc: { currentItems: 1 },
        $push: { loanIds: ticketNumber }
      }
    );

    // Record in DayBook
    const todayStr = loanDate.toISOString().split('T')[0];
    await DayBook.findOneAndUpdate(
      { date: todayStr },
      {
        $inc: {
          totalLoansDisbursedCash: disbursementMode === 'CASH' ? loanPrincipal : 0,
          totalLoansDisbursedBank: disbursementMode !== 'CASH' ? loanPrincipal : 0
        },
        $push: {
          transactions: {
            time: new Date(),
            type: 'DISBURSEMENT',
            referenceNumber: ticketNumber,
            partyName: customerName,
            amount: loanPrincipal,
            mode: disbursementMode === 'CASH' ? 'CASH' : 'BANK',
            handledBy: req.user?.name || 'Staff'
          }
        }
      },
      { upsert: true }
    );

    // Audit Log
    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Staff',
      action: 'DISBURSE_LOAN',
      details: `Disbursed loan ${ticketNumber} of ₹${loanPrincipal.toLocaleString('en-IN')} for ${customerName} (${totalNetWt}g gold)`,
      targetId: ticketNumber
    });

    // Trigger WhatsApp notification asynchronously
    sendPawnWhatsAppNotification({
      customerCode: tenantCode,
      customerMobile,
      customerName,
      eventType: 'LOAN_DISBURSED',
      data: {
        ticketNumber,
        principal: loanPrincipal,
        loanDate: loanDate.toLocaleDateString('en-IN'),
        maturityDate: maturityDate.toLocaleDateString('en-IN'),
        netWeight: totalNetWt,
        shopName: shopConfig.shopName
      }
    });

    // Generate Printable Receipt HTML
    const receiptHtml = generatePawnTicketHtml(newLoan, shopConfig);

    res.status(201).json({
      success: true,
      message: `Pawn ticket ${ticketNumber} disbursed successfully.`,
      loan: newLoan,
      receiptHtml
    });
  } catch (error) {
    console.error('[Disburse Loan Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get Printable Receipt HTML for a Loan
// @route   GET /api/loans/:id/receipt-html
router.get('/:id/receipt-html', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const shopConfig = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() }) || {};
    const html = generatePawnTicketHtml(loan, shopConfig);

    res.json({ success: true, html });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
