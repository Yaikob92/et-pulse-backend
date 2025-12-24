import mongoose, { Document, Schema } from "mongoose";

export interface IInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  newsId: mongoose.Types.ObjectId;
  type: "like" | "repost";
  createdAt: Date;
  updatedAt: Date;
}

const interactionSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "repost"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can only like/repost a news item once
interactionSchema.index({ userId: 1, newsId: 1, type: 1 }, { unique: true });

export default mongoose.model<IInteraction>("Interaction", interactionSchema);
