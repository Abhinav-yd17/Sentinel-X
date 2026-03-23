const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        process.env.CLIENT_URL,
      ].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("Authentication token required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] Connected: ${socket.id}`);
    socket.join("admins");
    socket.join(`role:${socket.user?.role || "viewer"}`);
    socket.emit("connected", { message: "Connected to SentinelX live feed" });
    socket.on("subscribe_user", (id) => socket.join(`user:${id}`));
    socket.on("unsubscribe_user", (id) => socket.leave(`user:${id}`));
    socket.on("disconnect", (reason) => logger.info(`[Socket] Disconnected: ${socket.id}`));
  });

  logger.info("✅ Socket.IO initialized");
  return io;
};

const emitToAdmins = (event, data) => { if (io) io.to("admins").emit(event, data); };
const emitToUserSubscribers = (externalUserId, event, data) => { if (io) io.to(`user:${externalUserId}`).emit(event, data); };
const getIO = () => io;

module.exports = { initSocket, emitToAdmins, emitToUserSubscribers, getIO };