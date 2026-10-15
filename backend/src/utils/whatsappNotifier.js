import axios from 'axios';

const RENIC_MASTER_URL = process.env.RENIC_MASTER_URL || 'https://renicsoft-backend.vercel.app';

export async function sendPawnWhatsAppNotification({
  customerCode,
  customerMobile,
  customerName,
  eventType, // 'LOAN_DISBURSED' | 'PAYMENT_RECEIVED' | 'MATURITY_REMINDER' | 'REDEMPTION_DISCHARGE'
  data = {}
}) {
  if (!customerMobile) return;
  
  let message = '';
  const shopName = data.shopName || 'Sri Lakshmi Pawn Brokers';
  
  switch (eventType) {
    case 'LOAN_DISBURSED':
      message = `*🏛️ ${shopName} - Pawn Pledge Confirmation*\n\nDear *${customerName}*,\nYour gold loan *${data.ticketNumber}* for *₹${(data.principal || 0).toLocaleString('en-IN')}* has been successfully disbursed.\n\n📅 Date: ${data.loanDate || new Date().toLocaleDateString('en-IN')}\n⚖️ Net Wt: ${data.netWeight || 0}g\n⏳ Maturity: ${data.maturityDate || ''}\n\nYour gold is safely stored in our insured vaults. Thank you for choosing us!`;
      break;
    case 'PAYMENT_RECEIVED':
      message = `*🧾 ${shopName} - Payment Acknowledgment*\n\nDear *${customerName}*,\nWe received *₹${(data.amount || 0).toLocaleString('en-IN')}* against Loan *${data.ticketNumber}* (Receipt: *${data.receiptNumber}*).\n\n💰 Principal Balance: ₹${(data.remainingPrincipal || 0).toLocaleString('en-IN')}\nThank you!`;
      break;
    case 'REDEMPTION_DISCHARGE':
      message = `*✨ ${shopName} - Gold Loan Redeemed*\n\nDear *${customerName}*,\nLoan *${data.ticketNumber}* is fully settled and your pledged ornaments (${data.netWeight || 0}g) have been safely returned.\nRedemption Ref: *${data.redemptionNumber}*.\n\nThank you for your business!`;
      break;
    case 'MATURITY_REMINDER':
      message = `*⚠️ ${shopName} - Gold Loan Due Reminder*\n\nDear *${customerName}*,\nThis is a friendly reminder that Loan *${data.ticketNumber}* (Principal: ₹${(data.principal || 0).toLocaleString('en-IN')}) is due on *${data.maturityDate}*.\n\nPlease visit our branch to renew or settle the interest.`;
      break;
    default:
      message = `*${shopName}*: Notification for Loan ${data.ticketNumber || ''}`;
  }

  try {
    // Attempt relay via Renic Soft WhatsApp integration
    await axios.post(`${RENIC_MASTER_URL}/api/notifications/whatsapp-direct`, {
      customerCode: (customerCode || 'renic-pb').toUpperCase(),
      to: customerMobile,
      message
    }, { timeout: 2000 }).catch(() => {});
  } catch (e) {
    // Non-blocking notification
  }
}

export default {
  sendPawnWhatsAppNotification
};
