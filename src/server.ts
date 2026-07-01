import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB, disConnect } from "./config/db.js";
import newsRoutes from "./routes/newsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import bookMarkRoutes from "./routes/bookMarkRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./config/inngest.js";
import { setupSwagger } from "./config/swagger.js";
import { Server } from "http";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security: CORS ────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

// ─── Security: Helmet HTTP headers ────────────────────────────────────────────
app.use(helmet());

// ─── Security: Global rate limiter (fallback on top of Arcjet) ───────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Body parsers ─────────────────────────────────────────────────────────────
// Webhook route needs the raw body for Svix signature verification
app.use(
  express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf.toString();
    },
    limit: "1mb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Auth & bot protection ────────────────────────────────────────────────────
app.use(clerkMiddleware());
app.use(arcjetMiddleware);

// ─── Inngest ──────────────────────────────────────────────────────────────────
app.use("/api/inngest", serve({ client: inngest, functions }));

// ─── Swagger (only in non-production, or set ENABLE_SWAGGER=true) ─────────────
if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
  setupSwagger(app);
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/news", bookMarkRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 uptime: { type: number }
 *                 timestamp: { type: string, format: date-time }
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({ message: "ET News Backend API Running", version: "1.0.0" });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
let server: Server;

(async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();

// ─── Process lifecycle ────────────────────────────────────────────────────────
process.on("unhandledRejection", (err: any) => {
  console.error("Unhandled Rejection:", err);
  server?.close(async () => {
    await disConnect();
    process.exit(1);
  });
});

process.on("uncaughtException", async (err: any) => {
  console.error("Uncaught Exception:", err);
  await disConnect();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server?.close(async () => {
    await disConnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server?.close(async () => {
    await disConnect();
    process.exit(0);
  });
});

export default app;
