const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { protect } = require("../middleware/auth.middleware");
const { validateApiKey } = require("../middleware/auth.middleware");
const { ingestLimiter, apiLimiter } = require("../middleware/rateLimit.middleware");
const { processEvent } = require("../pipeline");
const Event = require("../models/Event");
const logger = require("../utils/logger");

const router = express.Router();

// ── POST /api/v1/events/ingest ─────────────────────────────────
// External systems call this endpoint to submit activity logs
router.post(
  "/ingest",
  ingestLimiter,
  validateApiKey,
  [
    body("externalUserId").notEmpty().trim(),
    body("sourceSystem").notEmpty().trim(),
    body("type").notEmpty(),
    body("ip").optional().isIP(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const result = await processEvent(req.body);
      res.status(201).json({
        success: true,
        data: {
          eventId: result.event._id,
          riskScore: result.event.riskScore,
          flagged: result.event.flagged,
          alertGenerated: !!result.alert,
          alertId: result.alert?._id || null,
        },
      });
    } catch (err) {
      logger.error(`[Ingest] Error: ${err.message}`);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/v1/events/ingest/batch ──────────────────────────
// Batch ingestion (up to 100 events)
router.post(
  "/ingest/batch",
  ingestLimiter,
  validateApiKey,
  async (req, res) => {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "events[] array required" });
    }
    if (events.length > 100) {
      return res.status(400).json({ success: false, message: "Max 100 events per batch" });
    }

    const results = [];
    for (const raw of events) {
      try {
        const result = await processEvent(raw);
        results.push({ success: true, eventId: result.event._id, riskScore: result.event.riskScore });
      } catch (err) {
        results.push({ success: false, error: err.message, input: raw });
      }
    }

    res.status(207).json({ success: true, data: results });
  }
);

// ── GET /api/v1/events ─────────────────────────────────────────
router.get(
  "/",
  protect,
  apiLimiter,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 200 }),
    query("externalUserId").optional().trim(),
    query("type").optional(),
    query("flagged").optional().isBoolean(),
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
    query("minRisk").optional().isInt({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    try {
      const {
        page = 1, limit = 50,
        externalUserId, type, flagged,
        from, to, minRisk,
        sourceSystem,
      } = req.query;

      const filter = {};
      if (externalUserId) filter.externalUserId = externalUserId;
      if (type) filter.type = type;
      if (flagged !== undefined) filter.flagged = flagged === "true";
      if (sourceSystem) filter.sourceSystem = sourceSystem;
      if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
      }
      if (minRisk) filter.riskScore = { $gte: parseInt(minRisk) };

      const total = await Event.countDocuments(filter);
      const events = await Event.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/v1/events/:id ─────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
