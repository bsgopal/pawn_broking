import mongoose from 'mongoose';

const shopConfigSchema = new mongoose.Schema({
  customerCode: { type: String, uppercase: true, trim: true, default: 'DEFAULT' },
  shopName: { type: String, default: 'PawnBook Pro Jewelry Pawn Brokers' },
  rbiLicenseNo: { type: String, default: 'RB/PB/2026/001' },
  gstinNo: { type: String, default: '' },
  address: { type: String, default: '123 Commercial Street, City' },
  phone: { type: String, default: '' },
  mobile: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  
  // RBI Gold Loan & Pawn Broking Rules
  eligibleCollateralPct: { type: Number, default: 75 }, // RBI 75% LTV Cap
  rbiInterestCapPa: { type: Number, default: 24 }, // % per annum max
  defaultMonthlyInterestPct: { type: Number, default: 2.0 }, // % per month
  defaultGracePeriodDays: { type: Number, default: 7 },
  defaultPenaltyPct: { type: Number, default: 1.0 },
  defaultInterestScheme: { type: String, default: 'MONTHLY_SIMPLE' },

  // Dynamic Interest Schemes, Durations, Disbursement Modes & Custom Ornaments Catalog (Client Configurable)
  customOrnamentTypes: {
    type: [String],
    default: [
      'Gold Necklace (22K)',
      'Gold Bangles (Pair)',
      'Gold Chain (22K)',
      'Gold Ring / Band',
      'Gold Earrings / Studs',
      'Gold Mangalsutra / Thali',
      'Gold Coin / Bar 24K',
      'Gold Waist Belt (Oddiyanam)',
      'Gold Bracelet / Kada',
      'Silver Anklets / Kolusu',
      'Silver Plate / Articles'
    ]
  },
  interestSchemes: [{
    code: { type: String, default: 'STANDARD' },
    name: { type: String, default: 'Standard Pledge Rate' },
    monthlyRatePct: { type: Number, default: 2.0 },
    description: { type: String, default: '2% per month standard pledge' },
    isDefault: { type: Boolean, default: true }
  }],
  loanDurations: {
    type: [Number],
    default: [1, 2, 3, 6, 9, 12, 24, 36]
  },
  disbursementModes: [{
    code: { type: String, default: 'CASH' },
    label: { type: String, default: 'Cash Counter' },
    type: { type: String, default: 'CASH' }, // CASH, BANK, UPI, CHEQUE
    isDefault: { type: Boolean, default: true }
  }],
  
  // Master-Governed Multi-Branch & Features (synced from Renic Soft Master HQ)
  branchConfig: {
    mode: { type: String, enum: ['SINGLE', 'MULTI'], default: 'SINGLE' },
    maxBranches: { type: Number, default: 1 },
    allowInterBranchTransfer: { type: Boolean, default: false },
    branches: [{
      branchCode: { type: String, uppercase: true, trim: true },
      branchName: { type: String },
      address: { type: String },
      phone: { type: String },
      isMain: { type: Boolean, default: false }
    }]
  },
  featurePermissions: {
    allowPartialRelease: { type: Boolean, default: false },
    allowRePledge: { type: Boolean, default: false },
    enableBlacklistShield: { type: Boolean, default: true },
    allowCustomPrintTemplates: { type: Boolean, default: true }
  },

  // Customer KYC Document & Identity Policy (Client Managed)
  kycConfig: {
    customerPhoto: { enabled: { type: Boolean, default: true }, required: { type: Boolean, default: true } },
    aadhaar: { enabled: { type: Boolean, default: true }, required: { type: Boolean, default: true } },
    pan: { enabled: { type: Boolean, default: true }, required: { type: Boolean, default: false }, thresholdAmount: { type: Number, default: 200000 } },
    passbook: { enabled: { type: Boolean, default: true }, required: { type: Boolean, default: false } },
    voterId: { enabled: { type: Boolean, default: false }, required: { type: Boolean, default: false } },
    customDocs: [{
      docKey: { type: String },
      docLabel: { type: String },
      enabled: { type: Boolean, default: true },
      required: { type: Boolean, default: false }
    }]
  },

  // Automated WhatsApp Repayment Reminders (Client Managed)
  whatsappReminderConfig: {
    enabled: { type: Boolean, default: true },
    daysBeforeDue: { type: Number, default: 2 },
    templateLanguage: { type: String, default: 'en' },
    messageTemplate: { 
      type: String, 
      default: 'Dear {{customerName}}, this is a gentle reminder that your Gold Loan pledge {{ticketNumber}} of ₹{{principalAmount}} is due on {{dueDate}}. Total interest & principal payable: ₹{{totalDue}}. Pay via UPI: {{upiPayLink}} or visit {{shopName}} ({{branchPhone}}).' 
    },
    overdueTemplate: { 
      type: String, 
      default: 'URGENT: Dear {{customerName}}, your Gold Loan {{ticketNumber}} at {{shopName}} is overdue by {{daysOverdue}} days. Outstanding total: ₹{{totalDue}}. Please settle immediately to avoid statutory auction proceedings.' 
    }
  },

  // Branding & Assets (Uploaded by Client)
  brandingConfig: {
    logoUrl: { type: String, default: '' },
    stampUrl: { type: String, default: '' },
    letterheadUrl: { type: String, default: '' },
    upiId: { type: String, default: 'renicpawn@icici' },
    upiPayeeName: { type: String, default: 'PawnBook Pro' }
  },

  // DIY Visual Print & Quotation Designer Settings
  printConfig: {
    paperSize: { type: String, enum: ['80mm', '58mm', 'A4', 'A5', 'Letterhead'], default: '80mm' },
    showLogo: { type: Boolean, default: true },
    showQrCode: { type: Boolean, default: true },
    showCustomerPhoto: { type: Boolean, default: true },
    showOrnamentPhotos: { type: Boolean, default: false },
    showTerms: { type: Boolean, default: true },
    customHeader: { type: String, default: '' },
    customFooter: { type: String, default: 'Thank you for your business. Keep this receipt safe for redemption.' },
    customTerms: { type: String, default: '1. Ornaments pledged will be held in safe custody.\n2. Interest is calculated monthly as per RBI guidelines.\n3. Overdue loans beyond grace period are liable for statutory public auction with prior notice.' }
  },

  // Cashier & Manager Security Overrides
  managerSecurityConfig: {
    managerPin: { type: String, default: '1234' },
    requirePinForDiscountWaiver: { type: Boolean, default: true },
    waiverLimitWithoutPin: { type: Number, default: 500 },
    requirePinForLtvOverride: { type: Boolean, default: true }
  },

  // Pawn Ticket Number & Sequence Format (Client Managed)
  ticketConfig: {
    enabled: { type: Boolean, default: true },
    prefix: { type: String, default: 'PWN' },
    suffix: { type: String, default: '' },
    separator: { type: String, default: '-' },
    yearFormat: { type: String, enum: ['YYYY', 'YY', 'NONE'], default: 'YYYY' },
    monthFormat: { type: String, enum: ['MM', 'NONE'], default: 'NONE' },
    paddingDigits: { type: Number, default: 4, min: 2, max: 8 },
    nextSequence: { type: Number, default: 1 },
    patternTemplate: { type: String, default: '{PREFIX}-{YEAR}-{SEQ}' },
    strictEnforcement: { type: Boolean, default: true }
  },
  
  // Hardware & Communication
  thermalPrinterName: { type: String, default: 'Default Printer' },
  thermalPaperWidth: { type: String, default: '80mm' },
  autoPrintReceiptOnPawn: { type: Boolean, default: true },
  smsRemindersEnabled: { type: Boolean, default: true },
  whatsappAlertsEnabled: { type: Boolean, default: true },
  
  // Security & Screen gates
  screenPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  oauthConfig: {
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date }
  }
}, { timestamps: true });

export default mongoose.models.ShopConfig || mongoose.model('ShopConfig', shopConfigSchema);
