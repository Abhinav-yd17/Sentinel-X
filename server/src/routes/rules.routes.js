const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const Rule = require("../models/Rule");

const router = express.Router();

// ── GET /api/v1/rules ──────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const rules = await Rule.find().populate("createdBy", "name email").lean();
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/v1/rules ─────────────────────────────────────────
router.post(
  "/",
  protect,
  restrictTo("admin"),
  [
    body("name").notEmpty().trim(),
    body("description").notEmpty(),
    body("type").isIn(["threshold", "pattern", "frequency", "geo", "time_based"]),
    body("severity").isIn(["low", "medium", "high", "critical"]),
    body("alertType").notEmpty(),
    body("alertTitle").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const rule = await Rule.create({ ...req.body, createdBy: req.user._id });
      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Rule name already exists" });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/v1/rules/:id ──────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id).populate("createdBy", "name email");
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found" });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/v1/rules/:id ──────────────────────────────────────
router.put("/:id", protect, restrictTo("admin"), async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found" });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/v1/rules/:id/toggle ────────────────────────────
router.patch("/:id/toggle", protect, restrictTo("admin"), async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found" });
    rule.enabled = !rule.enabled;
    await rule.save();
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/v1/rules/:id ───────────────────────────────────
router.delete("/:id", protect, restrictTo("admin"), async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Rule deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
