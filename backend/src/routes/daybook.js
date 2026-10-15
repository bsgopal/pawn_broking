import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get DayBook Ledger for a specific date
// @route   GET /api/daybook
router.get('/', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const tenantCode = req.customerCode || getCurrentTenantCode();
    const DayBook = getTenantModel(tenantCode, 'DayBook');

    let daybook = await DayBook.findOne({ date: targetDate });

    if (!daybook) {
      // Find the most recent daybook entry before targetDate to carry over closing cash
      const previousDaybook = await DayBook.findOne({
        branchCode: req.user?.branchCode || 'CHN001',
        date: { $lt: targetDate }
      }).sort({ date: -1 });

      const carryoverOpeningCash = previousDaybook ? (previousDaybook.closingCashActual || previousDaybook.closingCashSystem || 0) : 0;

      daybook = await DayBook.create({
        date: targetDate,
        branchCode: req.user?.branchCode || 'CHN001',
        openingCash: carryoverOpeningCash,
        transactions: []
      });
    }

    // Compute live closing balance
    const totalCashIn = (daybook.openingCash || 0) +
      (daybook.totalInterestCollectedCash || 0) +
      (daybook.totalPrincipalRecoveredCash || 0) +
      (daybook.cashWithdrawnFromBank || 0);

    const totalCashOut = (daybook.totalLoansDisbursedCash || 0) +
      (daybook.pettyExpenses || 0) +
      (daybook.cashDepositedToBank || 0);

    daybook.closingCashSystem = totalCashIn - totalCashOut;

    res.json({ success: true, date: targetDate, daybook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add Petty Cash Expense or Bank Contra Entry
// @route   POST /api/daybook/entry
router.post('/entry', protect, authorize('ADMIN', 'MANAGER', 'CASHIER'), async (req, res) => {
  try {
    const { type, amount, partyName, mode = 'CASH', remarks } = req.body;
    const targetDate = new Date().toISOString().split('T')[0];

    const tenantCode = req.customerCode || getCurrentTenantCode();
    const DayBook = getTenantModel(tenantCode, 'DayBook');

    const entryAmount = Number(amount) || 0;
    if (entryAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }

    const updates = {
      $push: {
        transactions: {
          time: new Date(),
          type,
          referenceNumber: 'EXP-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          partyName: partyName || 'Miscellaneous Expense',
          amount: entryAmount,
          mode,
          handledBy: req.user?.name || 'Staff'
        }
      }
    };

    if (type === 'EXPENSE') {
      updates.$inc = { pettyExpenses: entryAmount };
    } else if (type === 'BANK_CONTRA') {
      if (mode === 'CASH_TO_BANK') {
        updates.$inc = { cashDepositedToBank: entryAmount };
      } else {
        updates.$inc = { cashWithdrawnFromBank: entryAmount };
      }
    }

    const daybook = await DayBook.findOneAndUpdate({ date: targetDate }, updates, { upsert: true, new: true });
    res.json({ success: true, message: 'Transaction entry added to Day Book', daybook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
