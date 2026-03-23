const mongoose = require("mongoose");

/**
 * MonitoredUser represents an external user being tracked by SentinelX.
 * These are NOT the admin portal users (that's the User model).
 * MonitoredUsers are the subjects of threat monitoring.
 */
const monitoredUserSchema = new mongoose.Schema({
  externalUserId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sourceSystem: { type: String, required: true },
  displayName: { type: String },
  email: { type: String },

  // ── Risk State ─────────────────────────────────────────────
  currentRiskScore: { type: Number, default: 0, min: 0, max: 100 },
  riskLevel: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low",
  },
  riskHistory: [{
    score: Number,
    reason: String,
    recordedAt: { type: Date, default: Date.now },
  }],

  // ── Baseline Profile ───────────────────────────────────────
  baselineProfile: {
    typicalLoginHours: { type: [Number], default: [] },
    typicalCountries: { type: [String], default: [] },
    typicalDevices: { type: [String], default: [] },
    avgDailyEvents: { type: Number, default: 0 },
    totalEventsProcessed: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },

  // ── Status ─────────────────────────────────────────────────
  accountStatus: {
    type: String,
    enum: ["active", "suspended", "flagged"],
    default: "active",
  },

  // ── Activity Summary ───────────────────────────────────────
  totalEvents: { type: Number, default: 0 },
  totalAlerts: { type: Number, default: 0 },
  lastSeen: { type: Date },
  lastEventType: { type: String },
  lastKnownIp: { type: String },
  lastKnownCountry: { type: String },
}, {
  timestamps: true,
});

// ── Pre-save: update riskLevel ─────────────────────────────────
monitoredUserSchema.pre("save", function (next) {
  const s = this.currentRiskScore;
  if (s >= 85) this.riskLevel = "critical";
  else if (s >= 65) this.riskLevel = "high";
  else if (s >= 40) this.riskLevel = "medium";
  else this.riskLevel = "low";
  next();
});

module.exports = mongoose.model("MonitoredUser", monitoredUserSchema);
