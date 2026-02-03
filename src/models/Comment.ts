import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  news: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  content: string;
  status: 'visible' | 'hidden' | 'flagged';
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema: Schema = new Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['visible', 'hidden', 'flagged'],
      default: 'visible',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>("Comment", commentSchema);
