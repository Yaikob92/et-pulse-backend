import mongoose, { Document, Schema } from "mongoose";

export interface IChannel extends Document {
  telegram_channel_id: number;
  name: string;
  username: string;
  profile_pic?: string;
  description?: string;
  subscribers_count: number;
  createdAt: Date;
  updatedAt: Date;
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
    timestamps: true,
    strict: true,
  }
);

channelSchema.index({ username: 1 });
channelSchema.index({ telegram_channel_id: 1 });

export default mongoose.model<IChannel>("Channel", channelSchema);
