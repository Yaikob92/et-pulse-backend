import mongoose, { Document, Schema } from "mongoose";

export interface INews extends Document {
  telegramId: string;
  channelUsername: string;
  channelProfilePic?: string;
  content?: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  likes: mongoose.Schema.Types.ObjectId[];

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
    likesCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    repostsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<INews>("News", newsSchema);
