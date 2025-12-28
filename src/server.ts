import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import newsRoutes from "./routes/newsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(clerkMiddleware());
app.use(arcjetMiddleware);

// Database connection middleware to ensure connection on every request (crucial for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/comment", commentRoutes);

app.get("/", (req, res) => {
  res.send("ET News Backend API Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log("Server is up and running on PORT:", PORT)
  );
}

export default app;
