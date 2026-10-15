import express from 'express';
import RePledge from '../models/RePledge.js';
import Loan from '../models/Loan.js';

const router = express.Router();

// GET /api/repledge - List all bank re-pledge records
router.get('/', async (req, res) => {
  try {
    const { status, bankName } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (bankName) filter.bankName = new RegExp(bankName, 'i');

    const records = await RePledge.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/repledge - Create a new bank re-pledge packet
router.post('/', async (req, res) => {
  try {
    const {
      bankName,
      bankBranch,
      bankAccountNumber,
      bankPledgeReferenceNo,
      maturityDate,
      refinancePrincipal,
      bankInterestRatePa,
      loanIds = [],
      branchCode = 'MAIN',
      remarks
    } = req.body;

    if (!bankName || !bankPledgeReferenceNo || !refinancePrincipal || !maturityDate) {
      return res.status(400).json({ success: false, message: 'Missing required bank re-pledge details' });
    }

    // Fetch linked customer loans
    const loans = await Loan.find({ _id: { $in: loanIds } });
    let totalGrossWt = 0;
    let totalNetWt = 0;
    let totalCollateralValuation = 0;

    const linkedLoans = loans.map(l => {
      totalGrossWt += (l.totalGrossWt || 0);
      totalNetWt += (l.totalNetWt || 0);
      totalCollateralValuation += (l.marketValuationTotal || 0);
      return {
        loanId: l._id,
        ticketNumber: l.ticketNumber,
        customerName: l.customerName,
        grossWeight: l.totalGrossWt,
        netWeight: l.totalNetWt,
        marketValuation: l.marketValuationTotal,
        originalPrincipal: l.principal
      };
    });

    const count = await RePledge.countDocuments();
    const rePledgeNo = `RPL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const rePledge = new RePledge({
      rePledgeNo,
      bankName,
      bankBranch,
      bankAccountNumber,
      bankPledgeReferenceNo,
      maturityDate,
      refinancePrincipal: Number(refinancePrincipal),
      bankInterestRatePa: Number(bankInterestRatePa || 8.5),
      bankMonthlyInterest: (Number(refinancePrincipal) * Number(bankInterestRatePa || 8.5)) / (12 * 100),
      linkedLoans,
      totalGrossWt,
      totalNetWt,
      totalCollateralValuation,
      branchCode,
      remarks: remarks || ''
    });

    await rePledge.save();

    // Mark individual loans as repledged
    await Loan.updateMany(
      { _id: { $in: loanIds } },
      {
        $set: {
          'repledgeStatus.isRepledged': true,
          'repledgeStatus.bankName': bankName,
          'repledgeStatus.bankPledgeNo': bankPledgeReferenceNo,
          'repledgeStatus.repledgeDate': new Date(),
          'repledgeStatus.repledgeAmount': Number(refinancePrincipal)
        }
      }
    );

    res.status(201).json({ success: true, rePledge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/repledge/:id/redeem - Redeem / Release gold from bank custody
router.post('/:id/redeem', async (req, res) => {
  try {
    const { totalPaidToBank, bankReleaseReceiptNo } = req.body;
    const rePledge = await RePledge.findById(req.params.id);
    if (!rePledge) {
      return res.status(404).json({ success: false, message: 'Re-pledge record not found' });
    }

    rePledge.status = 'Redeemed_From_Bank';
    rePledge.redemptionDate = new Date();
    rePledge.totalPaidToBank = Number(totalPaidToBank || rePledge.refinancePrincipal);
    rePledge.bankReleaseReceiptNo = bankReleaseReceiptNo || '';
    await rePledge.save();

    // Unmark loans as repledged
    const loanIds = rePledge.linkedLoans.map(l => l.loanId);
    await Loan.updateMany(
      { _id: { $in: loanIds } },
      {
        $set: {
          'repledgeStatus.isRepledged': false,
          'repledgeStatus.bankName': '',
          'repledgeStatus.bankPledgeNo': '',
          'repledgeStatus.repledgeDate': null,
          'repledgeStatus.repledgeAmount': 0
        }
      }
    );

    res.json({ success: true, message: 'Gold packet successfully redeemed from bank custody', rePledge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
