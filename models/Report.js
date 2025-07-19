const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true }, // can be user, post, etc.
  reason: { type: String },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema); 