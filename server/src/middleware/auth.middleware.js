const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify JWT from Authorization header
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({ success: false, message: `Account is ${user.accountStatus}` });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * Restrict to specific roles
 * Usage: restrictTo("admin", "analyst")
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(" or ")}`,
    });
  }
  next();
};

/**
 * Validate API key for external system event ingestion
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ success: false, message: "Invalid or missing API key" });
  }
  next();
};

module.exports = { protect, restrictTo, validateApiKey };
