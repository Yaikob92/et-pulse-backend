import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  to: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  type?: "breaking_news";
  isRead: boolean;
  news: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema: Schema = new Schema(
  {
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
    },
    type: {
      type: String,
      enum: ["breaking_news"],

      default: "breaking_news",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    news: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
