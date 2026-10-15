import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'STAFF', 'VALUER', 'CASHIER'],
    default: 'STAFF'
  },
  branchId: { type: String, default: '' },
  branchCode: { type: String, default: '' },
  permissions: {
    canDisburseLoan: { type: Boolean, default: true },
    canCollectPayment: { type: Boolean, default: true },
    canRedeemLoan: { type: Boolean, default: true },
    canUpdateRates: { type: Boolean, default: false },
    canManageVault: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
