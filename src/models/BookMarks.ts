import mongoose, { Document, Schema } from "mongoose";

export interface IBookmarks extends Document {
  user: mongoose.Types.ObjectId;
  news: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookMarksSchema: Schema = new Schema(
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
  },
  { timestamps: true }
);

export default mongoose.model<IBookmarks>("Bookmarks", bookMarksSchema);
