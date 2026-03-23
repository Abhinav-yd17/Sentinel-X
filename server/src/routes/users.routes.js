const express = require("express");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const MonitoredUser = require("../models/MonitoredUser");
const User = require("../models/User");
const Event = require("../models/Event");
const Alert = require("../models/Alert");

const router = express.Router();

// ── GET /api/v1/users/portal ───────────────────────────────────
// Portal users (admins, analysts, viewers)
router.get("/portal", protect, restrictTo("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken").lean();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/users ──────────────────────────────────────────
// Monitored (external) users
router.get("/", protect, async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      riskLevel, accountStatus, search,
      sortBy = "currentRiskScore", sortDir = "desc",
    } = req.query;

    const filter = {};
    if (riskLevel) filter.riskLevel = riskLevel;
    if (accountStatus) filter.accountStatus = accountStatus;
    if (search) {
      filter.$or = [
        { externalUserId: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const total = await MonitoredUser.countDocuments(filter);
    const users = await MonitoredUser.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/users/:externalUserId/risk ─────────────────────
router.get("/:externalUserId/risk", protect, async (req, res) => {
  try {
    const user = await MonitoredUser.findOne({ externalUserId: req.params.externalUserId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Recent events (last 50)
    const recentEvents = await Event.find({ externalUserId: req.params.externalUserId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Open alerts
    const openAlerts = await Alert.find({
      externalUserId: req.params.externalUserId,
      status: "open",
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        user,
        recentEvents,
        openAlerts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/users/:externalUserId/timeline ─────────────────
router.get("/:externalUserId/timeline", protect, async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;
    const filter = { externalUserId: req.params.externalUserId };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const events = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/v1/users/:externalUserId/status ─────────────────
router.patch("/:externalUserId/status", protect, restrictTo("admin", "analyst"), async (req, res) => {
  try {
    const { accountStatus } = req.body;
    const validStatuses = ["active", "suspended", "flagged"];
    if (!validStatuses.includes(accountStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const user = await MonitoredUser.findOneAndUpdate(
      { externalUserId: req.params.externalUserId },
      { accountStatus },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/v1/users/portal/:id (admin) ────────────────────
router.delete("/portal/:id", protect, restrictTo("admin"), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Portal user deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
