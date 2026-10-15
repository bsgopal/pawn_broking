import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  manager: { type: String, default: '' },
  phone: { type: String, default: '' },
  mobile: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  openTime: { type: String, default: '09:30 AM' },
  closeTime: { type: String, default: '07:30 PM' },
  vaults: [{ type: String }],
  staff: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Branch || mongoose.model('Branch', branchSchema);
