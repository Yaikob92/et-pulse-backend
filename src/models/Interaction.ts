import mongoose, { Document, Schema } from "mongoose";

export interface IInteraction extends Document {
  user: mongoose.Types.ObjectId;
  news: mongoose.Types.ObjectId;
  type: "like" | "repost";
  createdAt: Date;
  updatedAt: Date;
}

const interactionSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    news: {
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
interactionSchema.index({ user: 1, news: 1, type: 1 }, { unique: true });

export default mongoose.model<IInteraction>("Interaction", interactionSchema);
