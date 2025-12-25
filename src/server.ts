import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db";
import newsRoutes from "./routes/newsRoutes";
import userRoutes from "./routes/userRoutes";
import commentRoutes from "./routes/commentRoutes";
import { clerkMiddleware } from "@clerk/express";
import { arcjetMiddleware } from "./middleware/arcjet.middleware";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(clerkMiddleware());
app.use(arcjetMiddleware)

app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/comment", commentRoutes);

app.get("/", (req, res) => {
  res.send("ET News Backend API Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log("Server is up and running on PORT:", PORT)
    );
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();

export default app;
