import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  customerCode: { type: String, default: '', index: true },
  username: { type: String, default: 'System' },
  userRole: { type: String, default: 'Staff' },
  branchCode: { type: String, default: 'CHN001' },
  action: { type: String, required: true }, // e.g. 'DISBURSE_LOAN', 'INTEREST_PAYMENT', 'REDEMPTION', 'UPDATE_RATE', 'VAULT_MOVE'
  details: { type: String, default: '' },
  targetId: { type: String, default: '' },
  ipAddress: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
