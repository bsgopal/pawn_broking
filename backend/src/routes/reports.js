import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect } from '../middleware/auth.js';
import { calculateLoanInterest } from '../utils/interestCalculator.js';

const router = express.Router();

// @desc    Executive Dashboard Analytics & KPIs
// @route   GET /api/reports/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const Customer = getTenantModel(tenantCode, 'Customer');
    const Repayment = getTenantModel(tenantCode, 'Repayment');
    const Vault = getTenantModel(tenantCode, 'Vault');
    const MetalRate = getTenantModel(tenantCode, 'MetalRate');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeLoans,
      overdueLoans,
      redeemedLoans,
      totalCustomers,
      todayRepayments,
      monthRepayments,
      vaults,
      latestRate
    ] = await Promise.all([
      Loan.find({ status: { $in: ['Active', 'Overdue', 'Notice_Form1', 'Notice_Form2'] } }),
      Loan.find({ status: { $in: ['Overdue', 'Notice_Form1', 'Notice_Form2'] } }),
      Loan.find({ status: 'Redeemed' }),
      Customer.countDocuments(),
      Repayment.find({ paymentDate: { $gte: todayStart } }),
      Repayment.find({ paymentDate: { $gte: monthStart } }),
      Vault.find(),
      MetalRate.findOne().sort({ date: -1 })
    ]);

    const totalPrincipalOutstanding = activeLoans.reduce((acc, l) => acc + (l.principalOutstanding || l.principal || 0), 0);
    const totalPledgedGoldGrams = activeLoans.reduce((acc, l) => acc + (l.totalNetWt || 0), 0);
    const totalCollateralValuation = activeLoans.reduce((acc, l) => acc + (l.marketValuationTotal || 0), 0);

    let totalAccruedInterestDue = 0;
    activeLoans.forEach(l => {
      const calc = calculateLoanInterest({
        principal: l.principalOutstanding,
        interestScheme: l.interestScheme,
        monthlyRatePct: l.interestPctPerMonth,
        loanDate: l.lastPaymentDate || l.loanDate,
        asOfDate: now,
        durationMonths: l.durationMonths,
        gracePeriodDays: l.gracePeriodDays,
        penaltyMonthlyPct: l.penaltyPct
      });
      totalAccruedInterestDue += calc.totalInterest;
    });

    const todayCollection = todayRepayments.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
    const monthInterestEarnings = monthRepayments.reduce((acc, r) => acc + (r.interestPaid || 0) + (r.penaltyPaid || 0), 0);

    res.json({
      success: true,
      metrics: {
        totalActiveLoans: activeLoans.length,
        totalOverdueLoans: overdueLoans.length,
        totalRedeemedLoans: redeemedLoans.length,
        totalCustomers,
        totalPrincipalOutstanding,
        totalAccruedInterestDue: Math.round(totalAccruedInterestDue),
        totalPledgedGoldGrams: Number(totalPledgedGoldGrams.toFixed(3)),
        totalCollateralValuation,
        todayCollection,
        monthInterestEarnings,
        vaultOccupancyPct: vaults.length > 0 ? Math.round((vaults.reduce((a, v) => a + (v.currentItems || 0), 0) / (vaults.length * 15)) * 100) : 0
      },
      latestRate: latestRate || { gold22K: 6850, gold24K: 7450, silver: 92 }
    });
  } catch (error) {
    console.error('[Dashboard Report Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Statutory Form A (Register of Pledges under Pawn Brokers Act)
// @route   GET /api/reports/form-a
router.get('/form-a', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');

    const filter = {};
    if (startDate && endDate) {
      filter.loanDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const loans = await Loan.find(filter).sort({ loanDate: -1 });

    const rows = loans.map((l, idx) => {
      const itemsList = l.items || [];
      const totalStoneWt = itemsList.reduce((sum, it) => sum + (Number(it.stoneWeight) || 0), 0);
      const totalGrossWt = l.totalGrossWt || itemsList.reduce((sum, it) => sum + (Number(it.grossWeight) || 0), 0);
      const totalNetWt = l.totalNetWt || (totalGrossWt - totalStoneWt);

      return {
        _id: l._id,
        loanId: l._id,
        slNo: idx + 1,
        ticketNumber: l.ticketNumber,
        date: new Date(l.loanDate).toLocaleDateString('en-IN'),
        loanDate: l.loanDate,
        customerName: l.customerName,
        customerMobile: l.customerMobile,
        customerAadhaar: l.customerAadhaar,
        customerAddress: l.customerAddress || l.customerMobile,
        nomineeName: l.nomineeName,
        nomineeRelation: l.nomineeRelation,
        boxNo: l.boxNo || l.vaultBox || 'Main Safe',
        safeName: l.safeName || 'Safe A',
        articlesDescription: itemsList.map(it => `${it.quantity || 1}x ${it.ornamentType} (${it.purity || '22K'})`).join(', ') || 'Gold Collateral',
        items: itemsList.map(it => ({
          ornamentType: it.ornamentType || 'Gold Ornament',
          quantity: it.quantity || 1,
          purity: it.purity || '22K',
          grossWeight: Number(it.grossWeight) || 0,
          stoneWeight: Number(it.stoneWeight) || 0,
          tareWeight: Number(it.stoneWeight) || 0,
          netWeight: Number(it.netWeight) || ((Number(it.grossWeight) || 0) - (Number(it.stoneWeight) || 0)),
          marketValuation: Number(it.marketValuation) || 0,
          description: it.description || '',
          photos: it.photos || []
        })),
        grossWeightGrams: totalGrossWt,
        tareWeightGrams: totalStoneWt,
        stoneWeightGrams: totalStoneWt,
        netWeightGrams: totalNetWt,
        totalWeightGrams: totalGrossWt,
        assessedValue: l.marketValuationTotal || 0,
        principalAdvanced: l.principal || 0,
        principalOutstanding: l.principalOutstanding || l.principal || 0,
        monthlyInterestRate: `${l.interestPctPerMonth || 1.5}%`,
        maturityDate: l.maturityDate ? new Date(l.maturityDate).toLocaleDateString('en-IN') : 'N/A',
        status: l.status || 'Active'
      };
    });

    res.json({ success: true, count: rows.length, register: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    All Collateral Items & Vault Storage Inventory Matrix
// @route   GET /api/reports/items-inventory
router.get('/items-inventory', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');

    const loans = await Loan.find().sort({ loanDate: -1 });

    const allItems = [];
    let itemCounter = 1;

    loans.forEach(l => {
      const itemsList = l.items || [];
      const totalStoneWt = itemsList.reduce((sum, it) => sum + (Number(it.stoneWeight) || 0), 0);
      const totalGrossWt = l.totalGrossWt || itemsList.reduce((sum, it) => sum + (Number(it.grossWeight) || 0), 0);
      const totalNetWt = l.totalNetWt || (totalGrossWt - totalStoneWt);

      itemsList.forEach((it, idx) => {
        const gross = Number(it.grossWeight) || 0;
        const tare = Number(it.stoneWeight) || 0;
        const net = Number(it.netWeight) || (gross - tare);

        allItems.push({
          itemSlNo: itemCounter++,
          itemId: `${l.ticketNumber}-ITM-${idx + 1}`,
          loanId: l._id,
          ticketNumber: l.ticketNumber,
          customerName: l.customerName,
          customerMobile: l.customerMobile,
          customerAadhaar: l.customerAadhaar,
          customerAddress: l.customerAddress,
          vaultBox: l.boxNo || l.vaultBox || 'Safe A [Box #1]',
          safeName: l.safeName || 'Safe A',
          ornamentType: it.ornamentType || 'Gold Ornament',
          purity: it.purity || '22K',
          quantity: it.quantity || 1,
          grossWeight: gross,
          tareWeight: tare,
          stoneWeight: tare,
          netWeight: net,
          totalWeight: gross,
          marketValuation: Number(it.marketValuation) || 0,
          description: it.description || '',
          photos: it.photos || [],
          loanStatus: l.status,
          loanDate: l.loanDate,
          maturityDate: l.maturityDate,
          principal: l.principal,
          principalOutstanding: l.principalOutstanding,
          parentLoan: {
            ticketNumber: l.ticketNumber,
            customerName: l.customerName,
            customerMobile: l.customerMobile,
            boxNo: l.boxNo || l.vaultBox || 'Safe A [Box #1]',
            totalGrossWt,
            totalStoneWt,
            totalNetWt,
            status: l.status,
            items: itemsList
          }
        });
      });
    });

    res.json({ success: true, count: allItems.length, items: allItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Statutory Form C (Register of Redemptions)
// @route   GET /api/reports/form-c
router.get('/form-c', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Redemption = getTenantModel(tenantCode, 'Redemption');

    const filter = {};
    if (startDate && endDate) {
      filter.redemptionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const redemptions = await Redemption.find(filter).sort({ redemptionDate: -1 });

    const rows = redemptions.map((r, idx) => ({
      slNo: idx + 1,
      redemptionNumber: r.redemptionNumber,
      ticketNumber: r.ticketNumber,
      date: new Date(r.redemptionDate).toLocaleDateString('en-IN'),
      customerName: r.customerName,
      principalRecovered: r.principalSettled,
      interestCollected: r.interestSettled,
      totalReceived: r.totalAmountSettled,
      paymentMode: r.paymentMode,
      dischargedBy: r.dischargedBy
    }));

    res.json({ success: true, count: rows.length, register: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Overdue Aging Analysis
// @route   GET /api/reports/aging
router.get('/aging', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');

    const now = new Date();
    const overdueLoans = await Loan.find({
      status: { $in: ['Active', 'Overdue', 'Notice_Form1', 'Notice_Form2'] },
      maturityDate: { $lt: now }
    });

    const buckets = {
      bucket0_30: { count: 0, principal: 0, interestDue: 0 },
      bucket31_60: { count: 0, principal: 0, interestDue: 0 },
      bucket61_90: { count: 0, principal: 0, interestDue: 0 },
      bucket90_plus: { count: 0, principal: 0, interestDue: 0 }
    };

    overdueLoans.forEach(loan => {
      const diffTime = Math.max(0, now.getTime() - new Date(loan.maturityDate).getTime());
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const calc = calculateLoanInterest({
        principal: loan.principalOutstanding,
        interestScheme: loan.interestScheme,
        monthlyRatePct: loan.interestPctPerMonth,
        loanDate: loan.lastPaymentDate || loan.loanDate,
        asOfDate: now,
        durationMonths: loan.durationMonths,
        gracePeriodDays: loan.gracePeriodDays,
        penaltyMonthlyPct: loan.penaltyPct
      });

      const p = loan.principalOutstanding || loan.principal;
      const i = calc.totalInterest;

      if (overdueDays <= 30) {
        buckets.bucket0_30.count++;
        buckets.bucket0_30.principal += p;
        buckets.bucket0_30.interestDue += i;
      } else if (overdueDays <= 60) {
        buckets.bucket31_60.count++;
        buckets.bucket31_60.principal += p;
        buckets.bucket31_60.interestDue += i;
      } else if (overdueDays <= 90) {
        buckets.bucket61_90.count++;
        buckets.bucket61_90.principal += p;
        buckets.bucket61_90.interestDue += i;
      } else {
        buckets.bucket90_plus.count++;
        buckets.bucket90_plus.principal += p;
        buckets.bucket90_plus.interestDue += i;
      }
    });

    res.json({ success: true, totalOverdueCount: overdueLoans.length, buckets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
