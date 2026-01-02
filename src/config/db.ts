import mongoose from "mongoose";
import { disconnect } from "process";

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState >= 1) return;

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
};

export const disConnect = async (): Promise<void> => {
  await mongoose.disconnect();
};
