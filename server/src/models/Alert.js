const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  // ── Source ─────────────────────────────────────────────────
  externalUserId: { type: String, required: true, index: true },
  monitoredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "MonitoredUser" },
  triggeringEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  relatedEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

  // ── Classification ─────────────────────────────────────────
  type: {
    type: String,
    required: true,
    enum: [
      "brute_force",
      "credential_stuffing",
      "geo_anomaly",
      "device_anomaly",
      "unusual_time",
      "privilege_escalation",
      "data_exfiltration",
      "high_frequency",
      "account_takeover",
      "impossible_travel",
      "custom_rule",
    ],
  },
  severity: {
    type: String,
    required: true,
    enum: ["low", "medium", "high", "critical"],
    index: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },

  // ── Risk Context ───────────────────────────────────────────
  riskScore: { type: Number, required: true },
  riskFactors: [{ factor: String, weight: Number }],
  sourceSystem: { type: String },

  // ── Status & Resolution ────────────────────────────────────
  status: {
    type: String,
    enum: ["open", "investigating", "resolved", "false_positive"],
    default: "open",
    index: true,
  },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },

  // ── Rule Reference ─────────────────────────────────────────
  triggeredRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule" },
  triggeredRuleName: { type: String },

  // ── Notification ──────────────────────────────────────────
  notificationSent: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// ── Indexes ────────────────────────────────────────────────────
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ externalUserId: 1, createdAt: -1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
