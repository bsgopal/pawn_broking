import mongoose from 'mongoose';

const printTemplateSchema = new mongoose.Schema({
  templateType: {
    type: String,
    enum: ['pawn_receipt', 'repayment_receipt', 'redemption_receipt', 'ornament_tag', 'notice_form1', 'notice_form2'],
    required: true
  },
  name: { type: String, required: true },
  format: {
    type: String,
    enum: ['thermal_80mm', 'thermal_58mm', 'a4_standard', 'dot_matrix'],
    default: 'thermal_80mm'
  },
  headerHtml: { type: String, default: '' },
  footerHtml: { type: String, default: '' },
  customCss: { type: String, default: '' },
  showCustomerPhoto: { type: Boolean, default: false },
  showOrnamentDetails: { type: Boolean, default: true },
  showInterestTerms: { type: Boolean, default: true },
  showBarcode: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.PrintTemplate || mongoose.model('PrintTemplate', printTemplateSchema);
