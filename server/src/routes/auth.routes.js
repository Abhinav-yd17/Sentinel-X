const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const logger = require("../utils/logger");

const router = express.Router();

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

// ── POST /api/v1/auth/login ────────────────────────────────────
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password +refreshToken");

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      if (user.accountStatus !== "active") {
        return res.status(403).json({ success: false, message: `Account is ${user.accountStatus}` });
      }

      const accessToken = signToken(user._id, user.role);
      const refreshToken = signRefreshToken(user._id);

      user.refreshToken = refreshToken;
      user.lastSeen = new Date();
      user.lastLoginIp = req.ip;
      await user.save({ validateBeforeSave: false });

      logger.info(`[Auth] Login: ${email} (${user.role})`);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/v1/auth/refresh ──────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const newAccessToken = signToken(user._id, user.role);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

// ── POST /api/v1/auth/logout ───────────────────────────────────
router.post("/logout", protect, async (req, res) => {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, message: "Logged out successfully" });
});

// ── GET /api/v1/auth/me ────────────────────────────────────────
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      lastSeen: req.user.lastSeen,
    },
  });
});

// ── POST /api/v1/auth/register (admin only or first-time setup) ─
router.post(
  "/register",
  protect,
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role").isIn(["admin", "analyst", "viewer"]),
  ],
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can create users" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }

      const user = await User.create({ name, email, password, role, createdBy: req.user._id });
      res.status(201).json({
        success: true,
        data: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
