const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const riskHistorySchema = new mongoose.Schema({
  score: { type: Number, required: true },
  reason: { type: String },
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

const baselineProfileSchema = new mongoose.Schema({
  typicalLoginHours: [Number],           // e.g. [8,9,10,17,18]
  typicalCountries: [String],            // e.g. ["US", "CA"]
  typicalDevices: [String],              // device fingerprints
  avgDailyEvents: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
    select: false,
  },

  // ── RBAC ──────────────────────────────────────────────────
  role: {
    type: String,
    enum: ["admin", "analyst", "viewer"],
    default: "viewer",
  },

  // ── Account Status ────────────────────────────────────────
  accountStatus: {
    type: String,
    enum: ["active", "suspended", "locked"],
    default: "active",
  },
  suspensionReason: { type: String },

  // ── Risk Profile ──────────────────────────────────────────
  currentRiskScore: { type: Number, default: 0, min: 0, max: 100 },
  riskLevel: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low",
  },
  riskHistory: [riskHistorySchema],
  baselineProfile: { type: baselineProfileSchema, default: () => ({}) },

  // ── Auth Tokens ───────────────────────────────────────────
  refreshToken: { type: String, select: false },
  passwordChangedAt: Date,

  // ── Metadata ──────────────────────────────────────────────
  lastSeen: { type: Date },
  lastLoginIp: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ── Indexes ────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ currentRiskScore: -1 });
userSchema.index({ riskLevel: 1 });
userSchema.index({ accountStatus: 1 });

// ── Pre-save: Hash password ────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ── Pre-save: Compute riskLevel from score ─────────────────────
userSchema.pre("save", function (next) {
  const score = this.currentRiskScore;
  if (score >= 85) this.riskLevel = "critical";
  else if (score >= 65) this.riskLevel = "high";
  else if (score >= 40) this.riskLevel = "medium";
  else this.riskLevel = "low";
  next();
});

// ── Instance Methods ───────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateRiskScore = function (newScore, reason) {
  this.currentRiskScore = Math.min(100, Math.max(0, newScore));
  this.riskHistory.push({ score: newScore, reason });
  // Keep only last 100 history entries
  if (this.riskHistory.length > 100) {
    this.riskHistory = this.riskHistory.slice(-100);
  }
};

module.exports = mongoose.model("User", userSchema);
