const Event = require("../models/Event");

/**
 * RiskScorer: Calculates a 0–100 risk score for an event
 * using weighted rule-based heuristics + anomaly signals.
 */

// Base risk weights per event type
const BASE_WEIGHTS = {
  login_failure: 8,
  mfa_failure: 15,
  account_lockout: 25,
  password_change: 12,
  device_change: 18,
  location_change: 14,
  permission_change: 20,
  data_export: 22,
  suspicious_request: 30,
  login_success: 2,
  logout: 1,
  data_access: 5,
  api_request: 3,
  mfa_success: 1,
  custom: 10,
};

// Anomaly multipliers
const ANOMALY_WEIGHTS = {
  unusual_login_time: 10,
  unusual_country: 20,
  new_device: 12,
  impossible_travel: 35,
};

/**
 * Calculate risk score for a single event
 */
const calculateEventRisk = async (event, anomalies = [], monitoredUser = null) => {
  const riskFactors = [];
  let score = 0;

  // ── 1. Base event type weight ─────────────────────────────
  const baseWeight = BASE_WEIGHTS[event.type] || 5;
  score += baseWeight;
  riskFactors.push({ factor: `event_type:${event.type}`, weight: baseWeight });

  // ── 2. Anomaly contributions ──────────────────────────────
  for (const anomaly of anomalies) {
    const weight = ANOMALY_WEIGHTS[anomaly] || 8;
    score += weight;
    riskFactors.push({ factor: anomaly, weight });
  }

  // ── 3. Brute-force detection (login failures in window) ───
  if (event.type === "login_failure") {
    const windowStart = new Date(Date.now() - 10 * 60 * 1000); // 10 min
    const recentFailures = await Event.countDocuments({
      externalUserId: event.externalUserId,
      type: "login_failure",
      timestamp: { $gte: windowStart },
    });

    if (recentFailures >= 10) {
      score += 40;
      riskFactors.push({ factor: "brute_force_detected", weight: 40 });
    } else if (recentFailures >= 5) {
      score += 20;
      riskFactors.push({ factor: "multiple_login_failures", weight: 20 });
    } else if (recentFailures >= 3) {
      score += 8;
      riskFactors.push({ factor: "repeated_login_failures", weight: 8 });
    }
  }

  // ── 4. High frequency events (general) ───────────────────
  if (["api_request", "data_access"].includes(event.type)) {
    const windowStart = new Date(Date.now() - 60 * 1000); // 1 min
    const recentCount = await Event.countDocuments({
      externalUserId: event.externalUserId,
      type: event.type,
      timestamp: { $gte: windowStart },
    });
    if (recentCount > 60) {
      score += 25;
      riskFactors.push({ factor: "high_frequency_requests", weight: 25 });
    }
  }

  // ── 5. Impossible travel ──────────────────────────────────
  if (event.location?.country) {
    const lastEvent = await Event.findOne({
      externalUserId: event.externalUserId,
      "location.country": { $exists: true, $ne: null },
    }).sort({ timestamp: -1 });

    if (
      lastEvent?.location?.country &&
      lastEvent.location.country !== event.location.country
    ) {
      const timeDiffMinutes = (new Date(event.timestamp) - new Date(lastEvent.timestamp)) / 60000;
      // Country change within 30 minutes = impossible travel
      if (timeDiffMinutes < 30 && timeDiffMinutes > 0) {
        score += 35;
        riskFactors.push({ factor: "impossible_travel", weight: 35 });
        anomalies.push("impossible_travel");
      }
    }
  }

  // ── Clamp 0–100 ───────────────────────────────────────────
  score = Math.min(100, Math.max(0, score));

  return { score, riskFactors, anomalies };
};

/**
 * Determine updated user risk score:
 * Decays slowly if no new high-risk events, spikes on risky events.
 */
const calculateUserRiskScore = (currentScore, newEventScore) => {
  // Weighted blend: user score inertia + event spike
  const decayed = currentScore * 0.92;  // slight decay each event
  const updated = Math.max(decayed, Math.min(100, decayed + newEventScore * 0.4));
  return Math.round(updated);
};

module.exports = { calculateEventRisk, calculateUserRiskScore };
