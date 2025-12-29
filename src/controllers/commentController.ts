import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import News from "../models/News.js";

export const getComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { newsId } = req.params;

  const comments = await Comment.find({ newsId: newsId as any })
    .sort({ createdAt: -1 })
    .populate("userId", "username firstName lastName profilePicture");
  res.status(200).json({ comments });
};

export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  const { newsId } = req.params;
  const { content } = req.body;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!content || content.trim() === "") {
    res.status(400).json({ error: "Comment is required" });
    return;
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const news = await News.findById(newsId);
  if (!news) {
    res.status(404).json({ message: "News not found" });
    return;
  }

  const session = await mongoose.startSession();
  let comment: any;

  try {
    await session.withTransaction(async () => {
      const comments = await Comment.insertMany(
        [
          {
            userId: user._id,
            newsId: new mongoose.Types.ObjectId(newsId),
            content,
          },
        ],
        { session }
      );
      comment = comments[0];

      //   link the comment to the post and increment counter
      await News.findByIdAndUpdate(
        newsId,
        {
          $push: { comments: comment._id },
          $inc: { commentsCount: 1 },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json(comment);
};
