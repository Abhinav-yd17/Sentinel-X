const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const MonitoredUser = require("../models/MonitoredUser");

const router = express.Router();

// ── GET /api/v1/analytics/overview ────────────────────────────
router.get("/overview", protect, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      events24h,
      totalAlerts,
      openAlerts,
      criticalAlerts,
      totalUsers,
      highRiskUsers,
      flaggedEvents24h,
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ timestamp: { $gte: last24h } }),
      Alert.countDocuments(),
      Alert.countDocuments({ status: "open" }),
      Alert.countDocuments({ severity: "critical", status: "open" }),
      MonitoredUser.countDocuments(),
      MonitoredUser.countDocuments({ riskLevel: { $in: ["high", "critical"] } }),
      Event.countDocuments({ flagged: true, timestamp: { $gte: last24h } }),
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        events24h,
        totalAlerts,
        openAlerts,
        criticalAlerts,
        totalUsers,
        highRiskUsers,
        flaggedEvents24h,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/analytics/threat-trend ────────────────────────
// Hourly alert counts for the past 24 hours
router.get("/threat-trend", protect, async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trend = await Alert.aggregate([
      { $match: { createdAt: { $gte: last24h } } },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" },
            severity: "$severity",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.hour": 1 } },
    ]);

    res.json({ success: true, data: trend });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/analytics/top-risky-users ─────────────────────
router.get("/top-risky-users", protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const users = await MonitoredUser.find()
      .sort({ currentRiskScore: -1 })
      .limit(parseInt(limit))
      .select("externalUserId displayName currentRiskScore riskLevel totalAlerts lastSeen")
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/analytics/event-types ─────────────────────────
router.get("/event-types", protect, async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.timestamp = {};
      if (from) match.timestamp.$gte = new Date(from);
      if (to) match.timestamp.$lte = new Date(to);
    }

    const breakdown = await Event.aggregate([
      { $match: match },
      { $group: { _id: "$type", count: { $sum: 1 }, avgRisk: { $avg: "$riskScore" } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: breakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/analytics/geo-distribution ────────────────────
router.get("/geo-distribution", protect, async (req, res) => {
  try {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const geo = await Event.aggregate([
      { $match: { timestamp: { $gte: last7d }, "location.country": { $ne: null } } },
      {
        $group: {
          _id: "$location.country",
          count: { $sum: 1 },
          flaggedCount: { $sum: { $cond: ["$flagged", 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({ success: true, data: geo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/analytics/alert-resolution ────────────────────
router.get("/alert-resolution", protect, async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgResolutionHours: {
            $avg: {
              $cond: [
                { $and: ["$resolvedAt", "$createdAt"] },
                { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000] },
                null,
              ],
            },
          },
        },
      },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
