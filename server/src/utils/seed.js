require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Rule = require("../models/Rule");

const DEFAULT_RULES = [
  {
    name: "Brute Force Login Detection",
    description: "Triggers when 5+ login failures occur within 10 minutes for the same user",
    type: "threshold",
    thresholdCount: 5,
    thresholdWindowMinutes: 10,
    severity: "high",
    riskScoreIncrement: 30,
    alertType: "brute_force",
    alertTitle: "Brute Force Login Detected",
    applyToEventTypes: ["login_failure"],
    enabled: true,
  },
  {
    name: "Impossible Travel Alert",
    description: "Triggers when a user's country changes within 30 minutes",
    type: "geo",
    severity: "critical",
    riskScoreIncrement: 40,
    alertType: "impossible_travel",
    alertTitle: "Impossible Travel Detected",
    applyToEventTypes: ["login_success", "login_failure"],
    enabled: true,
  },
  {
    name: "High Frequency API Requests",
    description: "Triggers when a user makes more than 60 API requests in 1 minute",
    type: "frequency",
    frequencyLimit: 60,
    frequencyWindowMinutes: 1,
    severity: "medium",
    riskScoreIncrement: 20,
    alertType: "high_frequency",
    alertTitle: "Abnormal API Request Frequency",
    applyToEventTypes: ["api_request"],
    enabled: true,
  },
  {
    name: "Unusual Login Hour",
    description: "Triggers when login occurs outside the user's typical activity hours",
    type: "time_based",
    severity: "low",
    riskScoreIncrement: 10,
    alertType: "unusual_time",
    alertTitle: "Login at Unusual Hour",
    applyToEventTypes: ["login_success"],
    enabled: true,
  },
  {
    name: "MFA Failure Spike",
    description: "Triggers on 3+ MFA failures within 5 minutes",
    type: "threshold",
    thresholdCount: 3,
    thresholdWindowMinutes: 5,
    severity: "high",
    riskScoreIncrement: 35,
    alertType: "credential_stuffing",
    alertTitle: "MFA Failure Spike Detected",
    applyToEventTypes: ["mfa_failure"],
    enabled: true,
  },
  {
    name: "Data Exfiltration Risk",
    description: "Triggers on data export events from unusual locations or times",
    type: "pattern",
    severity: "critical",
    riskScoreIncrement: 45,
    alertType: "data_exfiltration",
    alertTitle: "Potential Data Exfiltration",
    applyToEventTypes: ["data_export"],
    enabled: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Create admin user
    const existing = await User.findOne({ email: "admin@sentinelx.dev" });
    if (!existing) {
      await User.create({
        name: "SentinelX Admin",
        email: "admin@sentinelx.dev",
        password: "Admin@123456",
        role: "admin",
      });
      console.log("✅ Admin user created: admin@sentinelx.dev / Admin@123456");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create analyst demo user
    const analystExists = await User.findOne({ email: "analyst@sentinelx.dev" });
    if (!analystExists) {
      await User.create({
        name: "Demo Analyst",
        email: "analyst@sentinelx.dev",
        password: "Analyst@123456",
        role: "analyst",
      });
      console.log("✅ Analyst user created: analyst@sentinelx.dev / Analyst@123456");
    }

    // Seed default rules
    for (const rule of DEFAULT_RULES) {
      const exists = await Rule.findOne({ name: rule.name });
      if (!exists) {
        await Rule.create(rule);
        console.log(`✅ Rule created: ${rule.name}`);
      }
    }

    console.log("\n🛡️  SentinelX seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

seed();
