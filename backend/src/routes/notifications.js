import express from 'express';
import Loan from '../models/Loan.js';
import ShopConfig from '../models/ShopConfig.js';

const router = express.Router();

// Helper to scope query by branch
const getBranchFilter = (req) => {
  const user = req.user;
  const branchQuery = req.query.branchCode || req.headers['x-branch-code'];
  if (user && user.role !== 'admin' && user.branchCode && user.branchCode !== '*') {
    return { branchCode: user.branchCode };
  }
  if (branchQuery && branchQuery !== '*' && branchQuery !== 'ALL') {
    return { branchCode: branchQuery };
  }
  return {};
};

// GET /api/notifications - Top Navigation In-App Alert Feed & Badge Counter
router.get('/', async (req, res) => {
  try {
    const config = await ShopConfig.findOne({}).lean() || {};
    const daysBeforeDue = config.whatsappReminderConfig?.daysBeforeDue || 2;
    const branchFilter = getBranchFilter(req);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(startOfToday.getTime() + (daysBeforeDue * 24 * 60 * 60 * 1000));
    const endOfTargetDate = new Date(targetDate.getTime() + (24 * 60 * 60 * 1000 - 1));

    // 1. Upcoming Repayments (Due within daysBeforeDue)
    const upcomingLoans = await Loan.find({
      ...branchFilter,
      status: { $in: ['Active', 'Renewed', 'Partially_Released'] },
      maturityDate: { $gte: startOfToday, $lte: endOfTargetDate }
    }).sort({ maturityDate: 1 }).lean();

    // 2. Overdue Loans
    const overdueLoans = await Loan.find({
      ...branchFilter,
      status: { $in: ['Active', 'Overdue', 'Notice_Form1', 'Notice_Form2'] },
      maturityDate: { $lt: startOfToday }
    }).sort({ maturityDate: 1 }).lean();

    const notifications = [
      ...upcomingLoans.map(loan => {
        const daysLeft = Math.ceil((new Date(loan.maturityDate) - now) / (1000 * 60 * 60 * 24));
        const totalDue = (loan.principalOutstanding || 0) + (loan.interestAccrued || 0);
        return {
          id: `upcoming-${loan._id}`,
          loanId: loan._id,
          ticketNumber: loan.ticketNumber,
          customerName: loan.customerName,
          customerMobile: loan.customerMobile,
          type: 'UPCOMING_REPAYMENT',
          title: `Upcoming Repayment (${daysLeft <= 0 ? 'Today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`})`,
          message: `Loan ${loan.ticketNumber} for ${loan.customerName} is due on ${new Date(loan.maturityDate).toLocaleDateString()}. Total payable: ₹${totalDue.toLocaleString('en-IN')}`,
          totalDue,
          principal: loan.principalOutstanding,
          interestDue: loan.interestAccrued,
          dueDate: loan.maturityDate,
          branchCode: loan.branchCode || 'MAIN',
          severity: daysLeft <= 1 ? 'urgent' : 'warning',
          timestamp: loan.maturityDate
        };
      }),
      ...overdueLoans.map(loan => {
        const daysOver = Math.max(1, Math.floor((now - new Date(loan.maturityDate)) / (1000 * 60 * 60 * 24)));
        const totalDue = (loan.principalOutstanding || 0) + (loan.interestAccrued || 0);
        return {
          id: `overdue-${loan._id}`,
          loanId: loan._id,
          ticketNumber: loan.ticketNumber,
          customerName: loan.customerName,
          customerMobile: loan.customerMobile,
          type: 'OVERDUE_ALERT',
          title: `Overdue Loan (${daysOver} Days Past Due)`,
          message: `Loan ${loan.ticketNumber} for ${loan.customerName} is overdue by ${daysOver} days. Immediate follow-up required.`,
          totalDue,
          principal: loan.principalOutstanding,
          interestDue: loan.interestAccrued,
          dueDate: loan.maturityDate,
          daysOverdue: daysOver,
          branchCode: loan.branchCode || 'MAIN',
          severity: 'danger',
          timestamp: loan.maturityDate
        };
      })
    ];

    const unreadCount = notifications.length;

    res.json({
      success: true,
      unreadCount,
      totalCount: notifications.length,
      upcomingCount: upcomingLoans.length,
      overdueCount: overdueLoans.length,
      notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/whatsapp-trigger - Build and dispatch customized WhatsApp message
router.post('/whatsapp-trigger', async (req, res) => {
  try {
    const { loanId, type = 'UPCOMING' } = req.body;
    if (!loanId) {
      return res.status(400).json({ success: false, message: 'loanId is required' });
    }

    const loan = await Loan.findById(loanId).lean();
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const config = await ShopConfig.findOne({}).lean() || {};
    const shopName = config.shopName || 'PawnBook Pro';
    const branchPhone = config.phone || config.mobile || 'Store Counter';
    const upiId = config.brandingConfig?.upiId || 'renicpawn@icici';
    const totalDue = (loan.principalOutstanding || 0) + (loan.interestAccrued || 0);
    const dueDateStr = new Date(loan.maturityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${totalDue}&tn=Loan-${loan.ticketNumber}`;

    let template = config.whatsappReminderConfig?.messageTemplate || 
      'Dear {{customerName}}, your Gold Loan {{ticketNumber}} of ₹{{principalAmount}} is due on {{dueDate}}. Total payable: ₹{{totalDue}}. Pay via UPI: {{upiPayLink}} or visit {{shopName}} ({{branchPhone}}).';

    if (type === 'OVERDUE' && config.whatsappReminderConfig?.overdueTemplate) {
      template = config.whatsappReminderConfig.overdueTemplate;
    }

    const now = new Date();
    const daysOverdue = Math.max(0, Math.floor((now - new Date(loan.maturityDate)) / (1000 * 60 * 60 * 24)));

    // Replace merge tags
    const renderedMessage = template
      .replace(/\{\{customerName\}\}/g, loan.customerName || 'Customer')
      .replace(/\{\{ticketNumber\}\}/g, loan.ticketNumber || '')
      .replace(/\{\{principalAmount\}\}/g, Number(loan.principalOutstanding || 0).toLocaleString('en-IN'))
      .replace(/\{\{interestDue\}\}/g, Number(loan.interestAccrued || 0).toLocaleString('en-IN'))
      .replace(/\{\{totalDue\}\}/g, Number(totalDue).toLocaleString('en-IN'))
      .replace(/\{\{dueDate\}\}/g, dueDateStr)
      .replace(/\{\{daysOverdue\}\}/g, String(daysOverdue))
      .replace(/\{\{shopName\}\}/g, shopName)
      .replace(/\{\{branchPhone\}\}/g, branchPhone)
      .replace(/\{\{upiPayLink\}\}/g, upiPayLink);

    // Build wa.me direct link
    const cleanMobile = (loan.customerMobile || '').replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const whatsappWebUrl = `https://wa.me/${mobileWithCountry}?text=${encodeURIComponent(renderedMessage)}`;

    res.json({
      success: true,
      customerName: loan.customerName,
      customerMobile: loan.customerMobile,
      message: renderedMessage,
      whatsappWebUrl,
      dispatched: true
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
