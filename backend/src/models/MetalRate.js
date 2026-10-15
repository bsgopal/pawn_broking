import mongoose from 'mongoose';

const metalRateSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
  gold22K: { type: Number, required: true }, // per gram
  gold24K: { type: Number, required: true }, // per gram
  gold18K: { type: Number, default: 0 },
  silver: { type: Number, required: true }, // per gram
  platinum: { type: Number, default: 0 }, // per gram
  updatedBy: { type: String, default: 'Manager' },
  history: [{
    date: { type: String },
    gold22K: { type: Number },
    gold24K: { type: Number },
    gold18K: { type: Number },
    silver: { type: Number },
    platinum: { type: Number }
  }]
}, { timestamps: true });

export default mongoose.models.MetalRate || mongoose.model('MetalRate', metalRateSchema);
