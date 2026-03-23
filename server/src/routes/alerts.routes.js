const express = require("express");
const { body, query } = require("express-validator");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const Alert = require("../models/Alert");

const router = express.Router();

// ── GET /api/v1/alerts ─────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      severity, status, externalUserId,
      from, to, type,
    } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (externalUserId) filter.externalUserId = externalUserId;
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("resolvedBy", "name email")
      .lean();

    res.json({
      success: true,
      data: alerts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/alerts/stats ───────────────────────────────────
router.get("/stats/summary", protect, async (req, res) => {
  try {
    const [bySeverity, byStatus, recent] = await Promise.all([
      Alert.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Alert.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);

    res.json({
      success: true,
      data: { bySeverity, byStatus, last24h: recent },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/alerts/:id ─────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("triggeringEventId")
      .populate("resolvedBy", "name email");
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/v1/alerts/:id/status ───────────────────────────
router.patch(
  "/:id/status",
  protect,
  restrictTo("admin", "analyst"),
  async (req, res) => {
    try {
      const { status, resolutionNotes } = req.body;
      const validStatuses = ["open", "investigating", "resolved", "false_positive"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const update = { status };
      if (status === "resolved" || status === "false_positive") {
        update.resolvedBy = req.user._id;
        update.resolvedAt = new Date();
        if (resolutionNotes) update.resolutionNotes = resolutionNotes;
      }

      const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true })
        .populate("resolvedBy", "name email");

      if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
      res.json({ success: true, data: alert });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/v1/alerts/:id (admin only) ─────────────────────
router.delete("/:id", protect, restrictTo("admin"), async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
