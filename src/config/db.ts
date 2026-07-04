import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoUri = process.env.DATABASE_URL;
if (!mongoUri) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const telegramUri =
  process.env.TELEGRAM_NEWS_DATABASE_URL ||
  mongoUri.replace(/\/Et-Pulse(\?|$)/, "/telegram_news$1");

export const telegramDb: Connection = mongoose.createConnection(telegramUri);

telegramDb.on("connected", () => {
  console.log("🚀 MongoDB Telegram News Connected");
});

telegramDb.on("error", (err) => {
  console.error("❌ MongoDB Telegram News Connection Error:", err);
});

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState >= 1) return;

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
};

export const disConnect = async (): Promise<void> => {
  await Promise.all([mongoose.disconnect(), telegramDb.close()]);
};
