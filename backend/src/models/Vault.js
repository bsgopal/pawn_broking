import mongoose from 'mongoose';

const vaultSchema = new mongoose.Schema({
  vaultName: { type: String, required: true, default: 'Main Vault Safe A' },
  compartmentNo: { type: Number, required: true },
  boxNo: { type: Number, required: true },
  capacity: { type: Number, default: 15 },
  currentItems: { type: Number, default: 0 },
  securityLevel: { type: String, default: 'MAXIMUM' },
  temperature: { type: Number, default: 21.0 },
  lastAudited: { type: Date, default: Date.now },
  loanIds: [{ type: String }], // Array of Loan ticketNumbers or IDs
  branchCode: { type: String, default: 'CHN001' }
}, { timestamps: true });

export default mongoose.models.Vault || mongoose.model('Vault', vaultSchema);
