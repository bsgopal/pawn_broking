import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  auctionNumber: { type: String, required: true, unique: true, index: true }, // e.g. AUC-2026-0001
  noticeForm1Date: { type: Date },
  noticeForm2Date: { type: Date },
  newspaperAdDate: { type: Date },
  auctionDate: { type: Date, required: true, index: true },
  venue: { type: String, default: 'Authorized Auction Hall' },
  authorizedAuctioneer: { type: String, default: 'State Registered Auctioneer' },
  
  loanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Loan' }],
  ticketNumbers: [{ type: String }],
  totalLotsCount: { type: Number, default: 0 },
  
  totalPrincipalRecoverable: { type: Number, default: 0 },
  totalInterestRecoverable: { type: Number, default: 0 },
  totalAuctionCharges: { type: Number, default: 0 },
  totalRealizedValue: { type: Number, default: 0 },
  surplusRefundableToCustomer: { type: Number, default: 0 },
  shortfallDeficit: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['PRE_NOTICE', 'FINAL_NOTICE_SENT', 'CATALOG_PUBLISHED', 'AUCTION_COMPLETED', 'SETTLED', 'CANCELLED'],
    default: 'PRE_NOTICE'
  },
  
  bidders: [{
    bidderName: { type: String },
    idProof: { type: String },
    mobile: { type: String },
    assignedLots: [{ type: String }],
    bidAmount: { type: Number },
    depositPaid: { type: Number }
  }],
  
  auctionSummaryReportPdfUrl: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Auction || mongoose.model('Auction', auctionSchema);
