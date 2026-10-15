import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';
import { calculateLoanInterest } from '../utils/interestCalculator.js';

const router = express.Router();

// @desc    Get Overdue Loans eligible for Auction Notice (Form 1 / Form 2)
// @route   GET /api/auctions/overdue-candidates
router.get('/overdue-candidates', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');

    const now = new Date();
    // Loans that have passed maturity date + grace period and are not redeemed
    const loans = await Loan.find({
      status: { $in: ['Active', 'Overdue', 'Notice_Form1', 'Notice_Form2'] },
      maturityDate: { $lte: now }
    }).sort({ maturityDate: 1 });

    const candidates = loans.map(loan => {
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

      return {
        ...loan.toObject(),
        overdueDays: calc.overdueDays,
        totalInterestDue: calc.totalInterest,
        penaltyDue: calc.penaltyInterest,
        totalClaimAmount: calc.totalPayable,
        estimatedSurplusOrDeficit: (loan.marketValuationTotal || 0) - calc.totalPayable
      };
    });

    res.json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get Scheduled and Completed Auctions
// @route   GET /api/auctions
router.get('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Auction = getTenantModel(tenantCode, 'Auction');
    const auctions = await Auction.find().sort({ auctionDate: -1 });
    res.json({ success: true, count: auctions.length, auctions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Schedule New Auction Event & Assign Lots
// @route   POST /api/auctions
router.post('/', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { auctionDate, venue, authorizedAuctioneer, loanIds = [], ticketNumbers = [] } = req.body;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Auction = getTenantModel(tenantCode, 'Auction');
    const Loan = getTenantModel(tenantCode, 'Loan');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const year = new Date().getFullYear();
    const count = await Auction.countDocuments();
    const auctionNumber = `AUC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Mark candidate loans as Auction_Pending
    await Loan.updateMany(
      { _id: { $in: loanIds } },
      { $set: { status: 'Auction_Pending' } }
    );

    const newAuction = await Auction.create({
      auctionNumber,
      auctionDate: new Date(auctionDate),
      venue: venue || 'Authorized Public Auction Hall',
      authorizedAuctioneer: authorizedAuctioneer || 'State Registered Auctioneer',
      loanIds,
      ticketNumbers,
      totalLotsCount: loanIds.length,
      status: 'CATALOG_PUBLISHED'
    });

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Manager',
      action: 'SCHEDULE_AUCTION',
      details: `Scheduled Auction ${auctionNumber} for ${loanIds.length} overdue loan lots on ${new Date(auctionDate).toLocaleDateString('en-IN')}`,
      targetId: auctionNumber
    });

    res.status(201).json({ success: true, message: `Auction ${auctionNumber} created`, auction: newAuction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Issue Form 1 / Form 2 Legal Notice for an Overdue Loan
// @route   POST /api/auctions/issue-notice
router.post('/issue-notice', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { loanId, noticeType = 'Notice_Form1', notes = '' } = req.body;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Loan = getTenantModel(tenantCode, 'Loan');
    const AuditLog = getTenantModel(tenantCode, 'AuditLog');

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    loan.status = noticeType; // 'Notice_Form1' or 'Notice_Form2'
    await loan.save();

    await AuditLog.create({
      customerCode: tenantCode.toUpperCase(),
      username: req.user?.name || 'Manager',
      action: 'ISSUE_LEGAL_NOTICE',
      details: `Dispatched statutory ${noticeType} for Loan ${loan.ticketNumber} to ${loan.customerName}`,
      targetId: loan.ticketNumber
    });

    res.json({ success: true, message: `${noticeType} issued for ${loan.ticketNumber}`, loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
