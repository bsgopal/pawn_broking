import mongoose from 'mongoose';

const pawnItemSchema = new mongoose.Schema({
  ornamentType: { type: String, required: true }, // e.g. Gold Ring, Necklace, Bangle, Silver Anklet
  metal: { type: String, enum: ['Gold', 'Silver', 'Platinum', 'Brass'], default: 'Gold' },
  purity: { type: String, default: '22K' }, // 24K, 22K, 18K, 925
  purityPct: { type: Number, default: 91.6 },
  quantity: { type: Number, default: 1 },
  grossWeight: { type: Number, required: true }, // grams
  netWeight: { type: Number, required: true }, // grams
  stoneWeight: { type: Number, default: 0 },
  stoneDeductionValue: { type: Number, default: 0 },
  marketRatePerGram: { type: Number, required: true },
  valuationAmount: { type: Number, required: true },
  remarks: { type: String, default: '' },
  photos: [{ type: String }],
  assayReportUrl: { type: String, default: '' },
  released: { type: Boolean, default: false },
  releasedAt: { type: Date },
  releaseVoucherNo: { type: String, default: '' }
}, { _id: false });

const loanSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true }, // e.g. PWN-2026-0001
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  branchId: { type: String, default: '' },
  branchCode: { type: String, default: 'MAIN', index: true },
  
  // Date and duration terms
  loanDate: { type: Date, default: Date.now, index: true },
  maturityDate: { type: Date, required: true, index: true },
  durationMonths: { type: Number, default: 3 },
  daysOverdue: { type: Number, default: 0 },
  renewalCount: { type: Number, default: 0 },
  lastRenewalDate: { type: Date },
  lastPaymentDate: { type: Date },
  
  // Financial amounts
  principal: { type: Number, required: true },
  principalOutstanding: { type: Number, required: true },
  interestScheme: {
    type: String,
    enum: ['MONTHLY_SIMPLE', 'MONTHLY_COMPOUND', 'REDUCING_BALANCE', 'DAILY_SLAB', 'FLAT'],
    default: 'MONTHLY_SIMPLE'
  },
  interestPctPerMonth: { type: Number, default: 2.0 }, // % per month
  interestPctPerAnnum: { type: Number, default: 24.0 }, // % per annum
  penaltyPct: { type: Number, default: 1.0 }, // penalty for overdue %
  gracePeriodDays: { type: Number, default: 7 },
  
  interestAccrued: { type: Number, default: 0 },
  interestCollected: { type: Number, default: 0 },
  penaltyCollected: { type: Number, default: 0 },
  
  // Ornaments & Valuation
  items: [pawnItemSchema],
  totalGrossWt: { type: Number, required: true },
  totalNetWt: { type: Number, required: true },
  totalStoneWt: { type: Number, default: 0 },
  marketValuationTotal: { type: Number, required: true },
  eligibleCollateralPct: { type: Number, default: 75 }, // RBI 75% LTV Cap
  maxEligibleLoan: { type: Number, required: true },
  
  // Storage & Vault Location
  vaultId: { type: String, default: 'Main Vault Safe A' },
  compartmentNo: { type: Number, default: 1 },
  boxNo: { type: Number, default: 1 },
  packetBarcode: { type: String, default: '' },
  pouchTagColor: { type: String, default: 'Burgundy' },
  
  // Status lifecycle
  status: {
    type: String,
    enum: ['Active', 'Redeemed', 'Partially_Released', 'Overdue', 'Notice_Form1', 'Notice_Form2', 'Auction_Pending', 'Auctioned', 'Renewed'],
    default: 'Active',
    index: true
  },
  
  // KYC & Customer Assets Snapshot
  customerPhotoUrl: { type: String, default: '' },
  documents: [{
    docType: { type: String }, // 'aadhaar', 'pan', 'passbook', 'voterId', 'custom'
    docNumber: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    verified: { type: Boolean, default: false }
  }],
  digitalSignatureUrl: { type: String, default: '' },

  // Master-Governed Partial Release History
  partialReleaseHistory: [{
    releaseDate: { type: Date, default: Date.now },
    releasedItems: [{ type: String }],
    releasedGrossWt: { type: Number, default: 0 },
    releasedNetWt: { type: Number, default: 0 },
    principalPaid: { type: Number, default: 0 },
    interestPaid: { type: Number, default: 0 },
    remainingPrincipal: { type: Number, default: 0 },
    remainingGrossWt: { type: Number, default: 0 },
    remainingNetWt: { type: Number, default: 0 },
    receiptNumber: { type: String, default: '' },
    otpVerified: { type: Boolean, default: true }
  }],

  // Bank Re-Pledging Custody Ledger
  repledgeStatus: {
    isRepledged: { type: Boolean, default: false },
    bankName: { type: String, default: '' },
    bankPledgeNo: { type: String, default: '' },
    repledgeDate: { type: Date },
    repledgeAmount: { type: Number, default: 0 }
  },

  // AML Statutory Cash Threshold Declaration
  amlDeclaration: {
    panNumber: { type: String, default: '' },
    form60Submitted: { type: Boolean, default: false },
    sourceOfFunds: { type: String, default: 'Personal Assets' }
  },
  
  // Processing & Staff metadata
  disbursedBy: { type: String, default: 'Counter Staff' },
  disbursementMode: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'], default: 'CASH' },
  customerSignPhoto: { type: String, default: '' },
  pawnTicketPdfUrl: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Loan || mongoose.model('Loan', loanSchema);
