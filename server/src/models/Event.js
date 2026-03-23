const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  ip: String,
  country: String,
  countryCode: String,
  region: String,
  city: String,
  lat: Number,
  lon: Number,
  timezone: String,
}, { _id: false });

const eventSchema = new mongoose.Schema({
  // ── Source ─────────────────────────────────────────────────
  // externalUserId: ID from the integrating external system
  externalUserId: {
    type: String,
    required: [true, "externalUserId is required"],
    index: true,
  },
  // monitoredUserId: resolved internal user (if matched)
  monitoredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MonitoredUser",
    index: true,
  },
  sourceSystem: {
    type: String,
    required: [true, "sourceSystem is required"],
    trim: true,
  },

  // ── Event Classification ───────────────────────────────────
  type: {
    type: String,
    required: [true, "Event type is required"],
    enum: [
      "login_success",
      "login_failure",
      "logout",
      "password_change",
      "mfa_failure",
      "mfa_success",
      "device_change",
      "location_change",
      "permission_change",
      "data_access",
      "data_export",
      "api_request",
      "account_lockout",
      "suspicious_request",
      "custom",
    ],
  },
  category: {
    type: String,
    enum: ["authentication", "authorization", "data", "network", "system"],
    required: true,
  },

  // ── Context ────────────────────────────────────────────────
  timestamp: { type: Date, default: Date.now, index: true },
  ip: { type: String },
  userAgent: { type: String },
  deviceId: { type: String },
  deviceType: { type: String, enum: ["desktop", "mobile", "tablet", "unknown"], default: "unknown" },
  location: { type: locationSchema },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // ── Risk Assessment ────────────────────────────────────────
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  riskFactors: [{ factor: String, weight: Number }],
  flagged: { type: Boolean, default: false, index: true },
  anomalies: [String],

  // ── Processing State ───────────────────────────────────────
  processed: { type: Boolean, default: false },
  alertGenerated: { type: Boolean, default: false },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: "Alert" },
}, {
  timestamps: true,
});

// ── Indexes ────────────────────────────────────────────────────
eventSchema.index({ externalUserId: 1, timestamp: -1 });
eventSchema.index({ type: 1, timestamp: -1 });
eventSchema.index({ riskScore: -1 });
eventSchema.index({ flagged: 1, processed: 1 });
// TTL: Auto-delete events older than 90 days
eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ── Virtual: age in minutes ────────────────────────────────────
eventSchema.virtual("ageMinutes").get(function () {
  return Math.floor((Date.now() - this.timestamp) / 60000);
});

module.exports = mongoose.model("Event", eventSchema);
