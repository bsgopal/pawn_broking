import mongoose from 'mongoose';

const dayBookSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  branchCode: { type: String, default: 'CHN001' },
  
  openingCash: { type: Number, default: 0 },
  totalLoansDisbursedCash: { type: Number, default: 0 },
  totalLoansDisbursedBank: { type: Number, default: 0 },
  totalInterestCollectedCash: { type: Number, default: 0 },
  totalInterestCollectedBank: { type: Number, default: 0 },
  totalPrincipalRecoveredCash: { type: Number, default: 0 },
  totalPrincipalRecoveredBank: { type: Number, default: 0 },
  
  pettyExpenses: { type: Number, default: 0 },
  cashDepositedToBank: { type: Number, default: 0 },
  cashWithdrawnFromBank: { type: Number, default: 0 },
  closingCashSystem: { type: Number, default: 0 },
  closingCashPhysical: { type: Number, default: 0 },
  cashDifference: { type: Number, default: 0 },
  
  transactions: [{
    time: { type: Date, default: Date.now },
    type: { type: String, enum: ['DISBURSEMENT', 'INTEREST_RECEIPT', 'PRINCIPAL_RECEIPT', 'REDEMPTION', 'EXPENSE', 'BANK_CONTRA'] },
    referenceNumber: { type: String }, // PWN-..., RCT-..., RED-...
    partyName: { type: String },
    amount: { type: Number },
    mode: { type: String, enum: ['CASH', 'BANK', 'UPI'] },
    handledBy: { type: String }
  }],
  
  status: { type: String, enum: ['OPEN', 'TALLIED', 'LOCKED'], default: 'OPEN' },
  closedBy: { type: String, default: '' },
  closedAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.DayBook || mongoose.model('DayBook', dayBookSchema);
