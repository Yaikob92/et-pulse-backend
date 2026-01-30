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

  const comments = await Comment.find({ news: newsId as any })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture");
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
            user: user._id,
            news: newsId,
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
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json(comment);
};

export const addReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;
  const { content } = req.body;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!content || content.trim() === "") {
    res.status(400).json({ error: "Reply content is required" });
    return;
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    res.status(404).json({ message: "Parent comment not found" });
    return;
  }

  const newsId = parentComment.news;

  const session = await mongoose.startSession();
  let reply: any;

  try {
    await session.withTransaction(async () => {
      const replies = await Comment.insertMany(
        [
          {
            user: user._id,
            news: newsId,
            content,
            parentComment: commentId,
          },
        ],
        { session }
      );
      reply = replies[0];

      // Add the reply to the news comments array if needed, 
      // although it's already linked via the news field in the reply itself.
      // The current system seems to push ALL comments to the News model.
      await News.findByIdAndUpdate(
        newsId,
        {
          $push: { comments: reply._id },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json(reply);
};

export const likeComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const { commentId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const index = comment.likes.findIndex(
      (id) => id.toString() === user._id.toString()
    );

    if (index === -1) {
      // Like
      comment.likes.push(user._id as any);
    } else {
      // Unlike
      comment.likes.splice(index, 1);
    }

    await comment.save();

    res.status(200).json({
      message: index === -1 ? "Liked" : "Unliked",
      likesCount: comment.likes.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
