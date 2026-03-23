require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const { initSocket } = require("./src/services/socket.service");
const logger = require("./src/utils/logger");

// Routes
const authRoutes = require("./src/routes/auth.routes");
const eventRoutes = require("./src/routes/events.routes");
const alertRoutes = require("./src/routes/alerts.routes");
const userRoutes = require("./src/routes/users.routes");
const ruleRoutes = require("./src/routes/rules.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Init Socket.IO
initSocket(server);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://sentinel-x-iota.vercel.app",
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/v1/auth",      authRoutes);
app.use("/api/v1/events",    eventRoutes);
app.use("/api/v1/alerts",    alertRoutes);
app.use("/api/v1/users",     userRoutes);
app.use("/api/v1/rules",     ruleRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SentinelX API", timestamp: new Date() });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🛡️  SentinelX server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, server };
