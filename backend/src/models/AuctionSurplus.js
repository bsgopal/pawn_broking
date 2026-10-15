import mongoose from 'mongoose';

const auctionSurplusSchema = new mongoose.Schema({
  surplusVoucherNo: { type: String, required: true, unique: true, index: true }, // e.g. SUR-2026-0001
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  ticketNumber: { type: String, required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  
  // Auction Details
  auctionDate: { type: Date, default: Date.now },
  auctionHouse: { type: String, default: 'Govt Approved Public Auctioneer' },
  bidderName: { type: String, required: true },
  bidderGstinOrPan: { type: String, default: '' },
  hammerPrice: { type: Number, required: true }, // Total bid revenue
  auctioneerCommission: { type: Number, default: 0 },
  netRealizedAmount: { type: Number, required: true },
  
  // Statutory Claim Breakdown
  principalDue: { type: Number, required: true },
  interestDue: { type: Number, required: true },
  noticeAndAdExpenses: { type: Number, default: 0 },
  totalShopClaim: { type: Number, required: true },
  
  // Surplus / Deficit
  surplusAmount: { type: Number, required: true }, // netRealized - totalShopClaim (if > 0)
  deficitAmount: { type: Number, default: 0 }, // totalShopClaim - netRealized (if > 0)
  
  // Refund Status
  status: {
    type: String,
    enum: ['Claim_Pending_Intimation', 'Intimation_Notice_Sent', 'Refund_Claimed', 'Transferred_To_State_Govt'],
    default: 'Claim_Pending_Intimation',
    index: true
  },
  intimationDate: { type: Date },
  intimationTrackingNo: { type: String, default: '' },
  refundPaidDate: { type: Date },
  refundPaymentMode: { type: String, enum: ['NEFT', 'RTGS', 'CHEQUE', 'UPI', 'CASH'], default: 'NEFT' },
  refundReferenceNo: { type: String, default: '' },
  borrowerReceiptSigned: { type: Boolean, default: false },
  branchCode: { type: String, default: 'MAIN', index: true },
  remarks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.AuctionSurplus || mongoose.model('AuctionSurplus', auctionSurplusSchema);
