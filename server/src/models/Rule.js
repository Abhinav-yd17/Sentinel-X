const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema({
  field: { type: String, required: true },   // e.g. "type", "location.country"
  operator: {
    type: String,
    required: true,
    enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "nin", "contains"],
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { _id: false });

const ruleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },

  // ── Detection Logic ────────────────────────────────────────
  type: {
    type: String,
    required: true,
    enum: ["threshold", "pattern", "frequency", "geo", "time_based"],
  },
  conditions: [conditionSchema],

  // Threshold rules: e.g. 5 failures in 10 minutes
  thresholdCount: { type: Number },
  thresholdWindowMinutes: { type: Number },

  // Frequency rules: e.g. > 100 API calls per hour
  frequencyLimit: { type: Number },
  frequencyWindowMinutes: { type: Number },

  // ── Output ─────────────────────────────────────────────────
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true,
  },
  riskScoreIncrement: { type: Number, default: 10, min: 0, max: 100 },
  alertType: { type: String, required: true },
  alertTitle: { type: String, required: true },
  alertDescriptionTemplate: { type: String },

  // ── Config ─────────────────────────────────────────────────
  enabled: { type: Boolean, default: true, index: true },
  applyToEventTypes: [String],

  // ── Stats ──────────────────────────────────────────────────
  triggerCount: { type: Number, default: 0 },
  lastTriggeredAt: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Rule", ruleSchema);
