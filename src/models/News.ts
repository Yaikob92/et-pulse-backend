import mongoose, { Document, Schema } from "mongoose";

export interface INews extends Document {
  telegramId: string;
  channelUsername: string;
  channelProfilePic?: string;
  content?: string;
  mediaUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema: Schema = new Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
    },
    channelUsername: {
      type: String,
      required: true,
      trim: true,
    },
    channelProfilePic: {
      type: String,
    },
    content: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
    },

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<INews>("News", newsSchema);
