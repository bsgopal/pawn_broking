import mongoose from 'mongoose';

const rePledgeSchema = new mongoose.Schema({
  rePledgeNo: { type: String, required: true, unique: true, index: true }, // e.g. RPL-2026-0001
  bankName: { type: String, required: true }, // SBI, Canara Bank, HDFC, Muthoot
  bankBranch: { type: String, default: '' },
  bankAccountNumber: { type: String, default: '' },
  bankPledgeReferenceNo: { type: String, required: true },
  
  // Date & terms
  rePledgeDate: { type: Date, default: Date.now },
  maturityDate: { type: Date, required: true },
  refinancePrincipal: { type: Number, required: true },
  bankInterestRatePa: { type: Number, required: true }, // e.g. 8.5%
  bankMonthlyInterest: { type: Number, default: 0 },
  
  // Linked Customer Loans & Collateral Packets
  linkedLoans: [{
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    ticketNumber: { type: String },
    customerName: { type: String },
    grossWeight: { type: Number },
    netWeight: { type: Number },
    marketValuation: { type: Number },
    originalPrincipal: { type: Number }
  }],
  totalGrossWt: { type: Number, required: true },
  totalNetWt: { type: Number, required: true },
  totalCollateralValuation: { type: Number, required: true },
  
  // Status
  status: {
    type: String,
    enum: ['Active_With_Bank', 'Redeemed_From_Bank', 'Closed'],
    default: 'Active_With_Bank',
    index: true
  },
  redemptionDate: { type: Date },
  totalPaidToBank: { type: Number, default: 0 },
  bankReleaseReceiptNo: { type: String, default: '' },
  branchCode: { type: String, default: 'MAIN', index: true },
  remarks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.RePledge || mongoose.model('RePledge', rePledgeSchema);
