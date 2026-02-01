import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB, disConnect } from "./config/db.js";
import newsRoutes from "./routes/newsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import bookMarkRoutes from "./routes/bookMarkRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";
import { Server } from "http";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.use("/api/news", bookMarkRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("ET News Backend API Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

let server: Server;

// Start server
(async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections
process.on("unhandledRejection", async (err: any) => {
  console.log("Unhandled Rejection:", err);
  server.close(async () => {
    await disConnect();
    process.exit(1);
  });
});

//  Handle uncaught exceptions
process.on("uncaughtException", async (err: any) => {
  console.error("Uncaught Exception:", err);
  await disConnect();
  process.exit(1);
});

// Gracefull shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disConnect();
    process.exit(0);
  });
});

export default app;
