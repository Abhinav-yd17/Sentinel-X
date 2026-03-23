const rateLimit = require("express-rate-limit");

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// General API limiter
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  "Too many requests, please try again later"
);

// Strict auth limiter (login/register)
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Too many authentication attempts. Try again in 15 minutes"
);

// Ingestion limiter (external systems)
const ingestLimiter = createLimiter(
  60 * 1000,
  500,
  "Ingestion rate limit exceeded"
);

module.exports = { apiLimiter, authLimiter, ingestLimiter };
