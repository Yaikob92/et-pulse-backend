import { Document, Schema } from "mongoose";
import { telegramDb } from "../config/db.js";

export interface IChannel extends Document {
  telegram_channel_id: number;
  name: string;
  username: string;
  profile_pic?: string;
  description?: string;
  subscribers_count: number;
  created_at: Date;
  updated_at: Date;
}

const channelSchema: Schema = new Schema(
  {
    telegram_channel_id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    profile_pic: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subscribers_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true,
  }
);

export default telegramDb.model<IChannel>("Channel", channelSchema);
