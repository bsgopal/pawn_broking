import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema({
  redemptionNumber: { type: String, required: true, unique: true, index: true }, // e.g. RED-2026-0001
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
  ticketNumber: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  branchCode: { type: String, default: '' },
  
  redemptionDate: { type: Date, default: Date.now, index: true },
  
  principalSettled: { type: Number, required: true },
  interestSettled: { type: Number, required: true },
  penaltySettled: { type: Number, default: 0 },
  waiverAmount: { type: Number, default: 0 },
  totalAmountSettled: { type: Number, required: true },
  
  paymentMode: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'],
    default: 'CASH'
  },
  referenceNo: { type: String, default: '' },
  
  // Ornament Release & Verification
  ornamentsHandedOver: { type: Boolean, default: true },
  verifiedGrossWeight: { type: Number, required: true },
  verifiedNetWeight: { type: Number, required: true },
  vaultClearedCompartment: { type: Number },
  
  customerSignProof: { type: String, default: '' },
  handedOverBy: { type: String, default: 'Vault Officer' },
  dischargedBy: { type: String, default: 'Branch Manager' },
  receiptPdfUrl: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Redemption || mongoose.model('Redemption', redemptionSchema);
