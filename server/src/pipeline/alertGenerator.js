const Alert = require("../models/Alert");
const Rule = require("../models/Rule");
const Event = require("../models/Event");

const SEVERITY_THRESHOLDS = {
  critical: parseInt(process.env.RISK_THRESHOLD_CRITICAL) || 85,
  high: parseInt(process.env.RISK_THRESHOLD_HIGH) || 65,
  medium: parseInt(process.env.RISK_THRESHOLD_MEDIUM) || 40,
};

/**
 * Determine severity from score
 */
const getSeverityFromScore = (score) => {
  if (score >= SEVERITY_THRESHOLDS.critical) return "critical";
  if (score >= SEVERITY_THRESHOLDS.high) return "high";
  if (score >= SEVERITY_THRESHOLDS.medium) return "medium";
  return "low";
};

/**
 * Map anomalies/event types to alert types
 */
const resolveAlertType = (event, anomalies) => {
  if (anomalies.includes("impossible_travel")) return "impossible_travel";
  if (anomalies.includes("unusual_country")) return "geo_anomaly";
  if (anomalies.includes("new_device")) return "device_anomaly";
  if (anomalies.includes("unusual_login_time")) return "unusual_time";
  if (anomalies.includes("brute_force_detected")) return "brute_force";

  const typeMap = {
    login_failure: "brute_force",
    mfa_failure: "credential_stuffing",
    account_lockout: "brute_force",
    permission_change: "privilege_escalation",
    data_export: "data_exfiltration",
    suspicious_request: "account_takeover",
  };
  return typeMap[event.type] || "custom_rule";
};

/**
 * Build human-readable alert description
 */
const buildDescription = (event, anomalies, score) => {
  const parts = [];

  if (anomalies.includes("brute_force_detected")) {
    parts.push("Brute-force login pattern detected with multiple rapid failures.");
  }
  if (anomalies.includes("impossible_travel")) {
    parts.push(`Impossible travel: country changed within 30 minutes.`);
  }
  if (anomalies.includes("unusual_country")) {
    parts.push(`Login from unusual country: ${event.location?.country}.`);
  }
  if (anomalies.includes("new_device")) {
    parts.push(`Activity from unrecognized device (${event.deviceId}).`);
  }
  if (anomalies.includes("unusual_login_time")) {
    parts.push(`Activity at an unusual hour (${new Date(event.timestamp).getHours()}:00).`);
  }

  parts.push(`Risk score: ${score}/100. Event type: ${event.type}. Source: ${event.sourceSystem}.`);
  return parts.join(" ");
};

/**
 * Core alert generation function.
 * Called after risk scoring if score >= medium threshold.
 */
const generateAlert = async (event, riskResult) => {
  const { score, riskFactors, anomalies } = riskResult;
  const severity = getSeverityFromScore(score);

  // Only generate alerts for medium+ severity
  if (score < SEVERITY_THRESHOLDS.medium) return null;

  // Deduplicate: don't re-alert same user+type within 5 minutes
  const recentAlert = await Alert.findOne({
    externalUserId: event.externalUserId,
    type: resolveAlertType(event, anomalies),
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });
  if (recentAlert) return null;

  const alertType = resolveAlertType(event, anomalies);

  const alert = await Alert.create({
    externalUserId: event.externalUserId,
    monitoredUserId: event.monitoredUserId,
    triggeringEventId: event._id,
    type: alertType,
    severity,
    title: formatAlertTitle(alertType, event),
    description: buildDescription(event, anomalies, score),
    riskScore: score,
    riskFactors,
    sourceSystem: event.sourceSystem,
    notificationSent: false,
  });

  // Back-reference on the event
  await Event.findByIdAndUpdate(event._id, {
    alertGenerated: true,
    alertId: alert._id,
  });

  return alert;
};

const formatAlertTitle = (type, event) => {
  const titles = {
    brute_force: `Brute Force Attack on ${event.externalUserId}`,
    credential_stuffing: `Credential Stuffing Attempt — ${event.externalUserId}`,
    geo_anomaly: `Geo Anomaly: Login from ${event.location?.country || "Unknown"}`,
    device_anomaly: `New Unrecognized Device for ${event.externalUserId}`,
    unusual_time: `Off-Hours Activity for ${event.externalUserId}`,
    impossible_travel: `Impossible Travel Detected — ${event.externalUserId}`,
    privilege_escalation: `Privilege Escalation Attempt — ${event.externalUserId}`,
    data_exfiltration: `Data Export Anomaly — ${event.externalUserId}`,
    account_takeover: `Possible Account Takeover — ${event.externalUserId}`,
    high_frequency: `Abnormal Request Frequency — ${event.externalUserId}`,
    custom_rule: `Security Rule Triggered — ${event.externalUserId}`,
  };
  return titles[type] || `Security Alert — ${event.externalUserId}`;
};

module.exports = { generateAlert, getSeverityFromScore };
