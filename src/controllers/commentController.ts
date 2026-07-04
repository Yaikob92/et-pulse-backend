import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import News from "../models/News.js";

const MAX_COMMENT_LENGTH = 2000;

export const getComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { newsId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(newsId)) {
      res.status(400).json({ message: "Invalid news ID" });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const comments = await Comment.find({ news: newsId as any, parentComment: null })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "username firstName lastName profilePicture")
      .lean();

    const total = await Comment.countDocuments({ news: newsId as any, parentComment: null });

    res.status(200).json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    console.error("getComments error:", error.message);
    res.status(500).json({ message: "Failed to fetch comments", error: error.message });
  }
};

export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const { newsId } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(newsId)) {
      res.status(400).json({ message: "Invalid news ID" });
      return;
    }

    if (!content || content.trim() === "") {
      res.status(400).json({ error: "Comment is required" });
      return;
    }

    if (content.trim().length > MAX_COMMENT_LENGTH) {
      res.status(400).json({ error: `Comment must not exceed ${MAX_COMMENT_LENGTH} characters` });
      return;
    }

    const [user, news] = await Promise.all([
      User.findOne({ clerkId: userId }),
      News.findById(newsId),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (!news) {
      res.status(404).json({ message: "News not found" });
      return;
    }

    let comment: any;
    const [created] = await Comment.insertMany([
      { user: user._id, news: newsId, content: content.trim() }
    ]);
    comment = created;

    await News.findByIdAndUpdate(
      newsId,
      { $push: { comments: comment._id }, $inc: { commentsCount: 1 } }
    );

    res.status(201).json(comment);
  } catch (error: any) {
    console.error("addComment error:", error.message);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

export const addReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const { commentId } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: "Invalid comment ID" });
      return;
    }

    if (!content || content.trim() === "") {
      res.status(400).json({ error: "Reply content is required" });
      return;
    }

    if (content.trim().length > MAX_COMMENT_LENGTH) {
      res.status(400).json({ error: `Reply must not exceed ${MAX_COMMENT_LENGTH} characters` });
      return;
    }

    const [user, parentComment] = await Promise.all([
      User.findOne({ clerkId: userId }),
      Comment.findById(commentId),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (!parentComment) {
      res.status(404).json({ message: "Parent comment not found" });
      return;
    }

    // Prevent deep nesting — only top-level comments can be replied to
    if (parentComment.parentComment) {
      res.status(400).json({ message: "Cannot reply to a reply. Reply to the top-level comment instead." });
      return;
    }

    const newsId = parentComment.news;

    let reply: any;
    const [created] = await Comment.insertMany([
      { user: user._id, news: newsId, content: content.trim(), parentComment: commentId }
    ]);
    reply = created;

    await News.findByIdAndUpdate(
      newsId,
      { $push: { comments: reply._id }, $inc: { commentsCount: 1 } }
    );

    res.status(201).json(reply);
  } catch (error: any) {
    console.error("addReply error:", error.message);
    res.status(500).json({ message: "Failed to add reply", error: error.message });
  }
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

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: "Invalid comment ID" });
      return;
    }

    const [user, comment] = await Promise.all([
      User.findOne({ clerkId: userId }),
      Comment.findById(commentId),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const userId_ = user._id as mongoose.Types.ObjectId;
    const alreadyLiked = comment.likes.some(
      (id) => id.toString() === userId_.toString()
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId_.toString()
      ) as any;
    } else {
      comment.likes.push(userId_ as any);
    }

    await comment.save();

    res.status(200).json({
      message: alreadyLiked ? "Unliked" : "Liked",
      likesCount: comment.likes.length,
    });
  } catch (error: any) {
    console.error("likeComment error:", error.message);
    res.status(500).json({ message: "Failed to toggle like", error: error.message });
  }
};
