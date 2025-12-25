import News from "../models/News.js";
import { Request, Response } from "express";
import Interaction from "../models/Interaction.js";
import Comment from "../models/Comment.js";
import { getAuth } from "@clerk/express";
import User from "../models/User.js";

// Get all news with pagination
export const getAllNews = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10)
  );
  const skip = (page - 1) * limit;

  const news = await News.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await News.countDocuments();

  res.json({
    news,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalNews: total,
  });
};

export const getChannelsPost = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10)
  );
  const skip = (page - 1) * limit;
  const { username } = req.params;

  const news = await News.find({ channelUsername: username })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await News.countDocuments({ channelUsername: username });

  res.json({
    news,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalNews: total,
  });
};

export const getNewsById = async (req: Request, res: Response): Promise<void> => {
  const { newsId } = req.params;

  const news = await News.findById(newsId);

  if (!news) {
    res.status(404).json({ message: "News not found" });
    return;
  }

  res.json({ news });
}
  ;

// Like a news item
export const likeNews = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  const { newsId } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Get MongoDB user from Clerk userId
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const existingInteraction = await Interaction.findOne({
    userId: user._id,
    newsId: newsId,
    type: "like",
  });

  if (existingInteraction) {
    // Unlike
    await Interaction.findByIdAndDelete(existingInteraction._id);
    await News.findByIdAndUpdate(newsId, { $inc: { likesCount: -1 } });
    res.json({ message: "Unliked" });
  } else {
    // Like
    await Interaction.create({
      userId: user._id,
      newsId: newsId,
      type: "like",
    });
    res.json({ message: "Liked" });
  }
}
  ;

// Repost a news item
export const repostNews = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  const { newsId } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Get MongoDB user from Clerk userId
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const existingInteraction = await Interaction.findOne({
    userId: user._id,
    newsId: newsId,
    type: "repost",
  });

  if (existingInteraction) {
    // Un-repost
    await Interaction.findByIdAndDelete(existingInteraction._id);
    await News.findByIdAndUpdate(newsId, { $inc: { repostsCount: -1 } });
    res.json({ message: "Unreposted" });
  } else {
    // Repost
    await Interaction.create({
      userId: user._id,
      newsId: newsId,
      type: "repost",
    });
    await News.findByIdAndUpdate(newsId, { $inc: { repostsCount: 1 } });
    res.json({ message: "Reposted" });
  }
}
  ;
