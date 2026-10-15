import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerNumber: { type: String, trim: true, index: true }, // e.g. CUST-0001
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true, index: true },
  altMobile: { type: String, default: '' },
  email: { type: String, default: '', lowercase: true, trim: true },
  
  // KYC details
  aadhaarNo: { type: String, default: '', trim: true },
  aadhaarVerified: { type: Boolean, default: false },
  panNo: { type: String, default: '', uppercase: true, trim: true },
  panVerified: { type: Boolean, default: false },
  voterId: { type: String, default: '' },
  drivingLicense: { type: String, default: '' },
  kycStatus: {
    type: String,
    enum: ['VERIFIED', 'PENDING', 'REJECTED'],
    default: 'PENDING'
  },
  
  // Personal information
  dob: { type: String, default: '' },
  gender: { type: String, enum: ['M', 'F', 'Other'], default: 'M' },
  occupation: { type: String, default: '' },
  monthlyIncome: { type: Number, default: 0 },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipcode: { type: String, default: '' },
  
  // Nominee information
  nominee: { type: String, default: '' },
  nomineeMob: { type: String, default: '' },
  relation: { type: String, default: '' },
  
  // Scoring & Exposure
  status: { type: String, enum: ['Active', 'Inactive', 'Blacklisted'], default: 'Active' },
  loyaltyPoints: { type: Number, default: 0 },
  totalLoansCount: { type: Number, default: 0 },
  activeLoansCount: { type: Number, default: 0 },
  totalPrincipalDisbursed: { type: Number, default: 0 },
  totalPrincipalOutstanding: { type: Number, default: 0 },
  totalDefaults: { type: Number, default: 0 },
  creditScore: { type: Number, default: 4.8 }, // 1 to 5
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  
  photo: { type: String, default: '' }, // base64 or URL
  aadhaarPhoto: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
