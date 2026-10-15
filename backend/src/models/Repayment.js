import mongoose from 'mongoose';

const repaymentSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true, index: true }, // e.g. RCT-2026-0001
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
  ticketNumber: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  branchCode: { type: String, default: '' },
  
  paymentDate: { type: Date, default: Date.now, index: true },
  paymentType: {
    type: String,
    enum: ['INTEREST_ONLY', 'PART_PRINCIPAL', 'RENEWAL_EXTENSION', 'FULL_SETTLEMENT', 'PENALTY_ONLY'],
    default: 'INTEREST_ONLY'
  },
  
  // Breakdown
  principalPaid: { type: Number, default: 0 },
  interestPaid: { type: Number, default: 0 },
  penaltyPaid: { type: Number, default: 0 },
  discountOrWaiver: { type: Number, default: 0 },
  totalPaid: { type: Number, required: true },
  
  // Balances after this transaction
  principalBalanceRemaining: { type: Number, required: true },
  interestCoveredUptoDate: { type: Date },
  newMaturityDate: { type: Date },
  
  paymentMode: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'],
    default: 'CASH'
  },
  referenceNo: { type: String, default: '' }, // UPI / Bank ref
  receivedBy: { type: String, default: 'Cashier' },
  voucherPdfUrl: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Repayment || mongoose.model('Repayment', repaymentSchema);
