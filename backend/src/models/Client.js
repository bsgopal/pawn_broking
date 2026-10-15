import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customerCode: { type: String, uppercase: true, trim: true, index: true },
  shopSlug: { type: String, lowercase: true, trim: true, default: '' },
  subdomain: { type: String, lowercase: true, trim: true, default: '' },
  licenseKey: { type: String, default: '' },
  licenseStatus: {
    type: String,
    enum: ['trial', 'active', 'grace_period', 'locked', 'cancelled', 'pending_activation'],
    default: 'active'
  },
  licenseStart: { type: Date, default: Date.now },
  licenseEnd: { type: Date },
  planTier: { type: String, default: 'pro' },
  screenPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  clientId: { type: String, default: '' },
  clientSecret: { type: String, default: '' },
  softwareProduct: { type: String, default: 'PAWN_BROKING' }
}, { timestamps: true });

export default mongoose.models.Client || mongoose.model('Client', clientSchema);
