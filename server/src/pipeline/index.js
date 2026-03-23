const { enrichEvent } = require("./enricher");
const { analyzeEvent, updateBaseline } = require("./behaviorAnalyzer");
const { calculateEventRisk, calculateUserRiskScore } = require("./riskScorer");
const { generateAlert } = require("./alertGenerator");
const Event = require("../models/Event");
const MonitoredUser = require("../models/MonitoredUser");
const { emitToAdmins } = require("../services/socket.service");
const logger = require("../utils/logger");

/**
 * Main pipeline: Ingests a raw event payload and runs it through
 * enrichment → behavior analysis → risk scoring → alert generation.
 *
 * @param {Object} rawEvent - The raw event from an external system
 * @returns {Object} { event, alert, monitoredUser }
 */
const processEvent = async (rawEvent) => {
  try {
    // ── STEP 1: Enrich ─────────────────────────────────────
    const enriched = enrichEvent(rawEvent);

    // ── STEP 2: Upsert MonitoredUser ───────────────────────
    let monitoredUser = await MonitoredUser.findOne({
      externalUserId: enriched.externalUserId,
    });

    if (!monitoredUser) {
      monitoredUser = await MonitoredUser.create({
        externalUserId: enriched.externalUserId,
        sourceSystem: enriched.sourceSystem,
        displayName: enriched.metadata?.userName || enriched.externalUserId,
        email: enriched.metadata?.email || null,
      });
    }

    enriched.monitoredUserId = monitoredUser._id;

    // ── STEP 3: Behavior Analysis ──────────────────────────
    const { anomalies } = analyzeEvent(enriched, monitoredUser);

    // ── STEP 4: Risk Scoring ───────────────────────────────
    const riskResult = await calculateEventRisk(enriched, anomalies, monitoredUser);

    // ── STEP 5: Persist Event ──────────────────────────────
    const event = await Event.create({
      ...enriched,
      riskScore: riskResult.score,
      riskFactors: riskResult.riskFactors,
      anomalies: riskResult.anomalies,
      flagged: riskResult.score >= 40,
      processed: true,
    });

    // ── STEP 6: Update User Risk Score + Baseline ──────────
    const newUserScore = calculateUserRiskScore(
      monitoredUser.currentRiskScore,
      riskResult.score
    );

    const updatedBaseline = updateBaseline(monitoredUser.baselineProfile, enriched);

    monitoredUser.currentRiskScore = newUserScore;
    monitoredUser.baselineProfile = updatedBaseline;
    monitoredUser.totalEvents += 1;
    monitoredUser.lastSeen = new Date();
    monitoredUser.lastEventType = enriched.type;
    monitoredUser.lastKnownIp = enriched.ip;
    monitoredUser.lastKnownCountry = enriched.location?.country;

    if (riskResult.score >= 40) {
      monitoredUser.riskHistory.push({
        score: newUserScore,
        reason: riskResult.riskFactors.map(f => f.factor).join(", "),
      });
      if (monitoredUser.riskHistory.length > 100) {
        monitoredUser.riskHistory = monitoredUser.riskHistory.slice(-100);
      }
    }
    await monitoredUser.save();

    // ── STEP 7: Generate Alert ─────────────────────────────
    let alert = null;
    if (riskResult.score >= 40) {
      alert = await generateAlert(event, riskResult);
      if (alert) {
        monitoredUser.totalAlerts += 1;
        await monitoredUser.save();

        // Emit real-time alert to connected dashboard clients
        emitToAdmins("new_alert", {
          alert,
          monitoredUser: {
            externalUserId: monitoredUser.externalUserId,
            displayName: monitoredUser.displayName,
            currentRiskScore: monitoredUser.currentRiskScore,
            riskLevel: monitoredUser.riskLevel,
          },
        });
      }
    }

    // ── STEP 8: Emit live event to dashboard ───────────────
    emitToAdmins("new_event", {
      eventId: event._id,
      externalUserId: event.externalUserId,
      type: event.type,
      riskScore: event.riskScore,
      flagged: event.flagged,
      location: event.location,
      timestamp: event.timestamp,
      sourceSystem: event.sourceSystem,
    });

    logger.info(`[Pipeline] Processed event ${event._id} | user=${enriched.externalUserId} | score=${riskResult.score} | alert=${alert?._id || "none"}`);

    return { event, alert, monitoredUser };
  } catch (error) {
    logger.error(`[Pipeline] Error processing event: ${error.message}`);
    throw error;
  }
};

module.exports = { processEvent };
