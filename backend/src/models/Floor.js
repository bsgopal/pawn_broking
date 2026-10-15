import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branchCode: { type: String, default: '' },
  capacity: { type: Number, default: 100 },
  securityLevel: { type: String, default: 'Maximum Security' },
  itemsCount: { type: Number, default: 0 },
  loanIds: [{ type: String }],
  photoProof: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Floor || mongoose.model('Floor', floorSchema);
