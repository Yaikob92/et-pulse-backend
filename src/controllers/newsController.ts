import News from "../models/News.js";
import Channel from "../models/Channel.js";
import { Request, Response } from "express";
import Interaction from "../models/Interaction.js";
import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import mongoose from "mongoose";

// Get all news with pagination, filtering, and search
export const getAllNews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const { userId } = getAuth(req);
    let userObjectId: mongoose.Types.ObjectId | null = null;
    const collectionName = Interaction.collection.name;

    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        userObjectId = user._id as mongoose.Types.ObjectId;
      }
    }

    // Build match filter
    const matchFilter: any = {};
    if (category && category !== "All") {
      matchFilter.category = category;
    }
    if (search) {
      matchFilter.$text = { $search: search };
    }

    const pipeline: any[] = [];

    // Match filter (category/search)
    if (Object.keys(matchFilter).length > 0) {
      pipeline.push({ $match: matchFilter });
    }

    pipeline.push(
      { $sort: { published_at: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Lookup likes from Interaction collection
      {
        $lookup: {
          from: collectionName,
          let: { newsId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$news", "$$newsId"] },
                    { $eq: ["$type", "like"] },
                  ],
                },
              },
            },
          ],
          as: "likeInteractions",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likeInteractions" },
          isLiked: userObjectId
            ? { $in: [userObjectId, "$likeInteractions.user"] }
            : false,
        },
      },
      { $project: { likeInteractions: 0, raw_text: 0 } }
    );

    const news = await News.aggregate(pipeline);

    const populatedNews = await News.populate(news, [
      {
        path: "comments",
        populate: {
          path: "user",
          select: "username firstName lastName profilePicture",
        },
      },
      {
        path: "channel_id",
      },
    ]);

    const total = Object.keys(matchFilter).length > 0
      ? await News.countDocuments(matchFilter)
      : await News.estimatedDocumentCount();

    res.status(200).json({
      news: populatedNews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNews: total,
    });
  } catch (error: any) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ message: "Failed to fetch news", error: error.message });
  }
};

export const getChannelsPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );
    const skip = (page - 1) * limit;
    const { username } = req.params;
    const collectionName = Interaction.collection.name;

    const channel = await Channel.findOne({ username });
    if (!channel) {
      res.status(404).json({ message: "Channel not found" });
      return;
    }

    const { userId } = getAuth(req);
    let userObjectId: mongoose.Types.ObjectId | null = null;

    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        userObjectId = user._id as mongoose.Types.ObjectId;
      }
    }

    const news = await News.aggregate([
      { $match: { channel_id: channel._id } },
      { $sort: { published_at: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: collectionName,
          let: { newsId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$news", "$$newsId"] },
                    { $eq: ["$type", "like"] },
                  ],
                },
              },
            },
          ],
          as: "likeInteractions",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likeInteractions" },
          isLiked: userObjectId
            ? { $in: [userObjectId, "$likeInteractions.user"] }
            : false,
        },
      },
      { $project: { likeInteractions: 0, raw_text: 0 } },
    ]);

    const populatedNews = await News.populate(news, {
      path: "channel_id"
    });

    const total = await News.countDocuments({ channel_id: channel._id });

    res.status(200).json({
      news: populatedNews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNews: total,
    });
  } catch (error: any) {
    console.error("Error fetching channel posts:", error.message);
    res.status(500).json({ message: "Failed to fetch channel posts", error: error.message });
  }
};

export const getNewsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { newsId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(newsId)) {
      res.status(400).json({ message: "Invalid news ID" });
      return;
    }

    const { userId } = getAuth(req);
    let userObjectId: mongoose.Types.ObjectId | null = null;

    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        userObjectId = user._id as mongoose.Types.ObjectId;
      }
    }

    const news = await News.findById(newsId)
      .populate("channel_id")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username firstName lastName profilePicture",
        },
      });

    if (!news) {
      res.status(404).json({ message: "News not found" });
      return;
    }

    const likesCount = await Interaction.countDocuments({
      news: newsId,
      type: "like",
    });

    let isLiked = false;
    if (userObjectId) {
      const interaction = await Interaction.findOne({
        user: userObjectId,
        news: newsId,
        type: "like",
      });
      isLiked = !!interaction;
    }

    const newsObj = news.toObject() as any;

    res.status(200).json({
      news: {
        ...newsObj,
        likesCount,
        isLiked,
      },
    });
  } catch (error: any) {
    console.error("Error fetching news by ID:", error.message);
    res.status(500).json({ message: "Failed to fetch news", error: error.message });
  }
};

// Like a news item
export const likeNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const { newsId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!newsId || !mongoose.Types.ObjectId.isValid(newsId)) {
      res.status(400).json({ message: "Valid News ID is required" });
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

    const existingInteraction = await Interaction.findOne({
      user: user._id,
      news: newsId,
      type: "like",
    });

    if (existingInteraction) {
      await Interaction.findByIdAndDelete(existingInteraction._id);
      res.json({ message: "Unliked" });
    } else {
      await Interaction.create({
        user: user._id,
        news: newsId,
        type: "like",
      });
      res.json({ message: "Liked" });
    }
  } catch (error: any) {
    console.error("Error toggling like:", error.message);
    res.status(500).json({
      message: "Failed to like news",
      error: error.message,
    });
  }
};

// Repost a news item
export const repostNews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const { newsId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!newsId || !mongoose.Types.ObjectId.isValid(newsId)) {
      res.status(400).json({ message: "Valid News ID is required" });
      return;
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existingInteraction = await Interaction.findOne({
      user: user._id,
      news: newsId,
      type: "repost",
    });

    if (existingInteraction) {
      await Interaction.findByIdAndDelete(existingInteraction._id);
      res.json({ message: "Unreposted" });
    } else {
      await Interaction.create({
        user: user._id,
        news: newsId,
        type: "repost",
      });
      res.json({ message: "Reposted" });
    }
  } catch (error: any) {
    console.error("Error toggling repost:", error.message);
    res.status(500).json({
      message: "Failed to repost news",
      error: error.message,
    });
  }
};

// Search news
export const searchNews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = req.query.q as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const news = await News.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
      .select("-raw_text")
      .populate("channel_id");

    const total = await News.countDocuments({ $text: { $search: query } });

    res.status(200).json({
      news,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNews: total,
    });
  } catch (error: any) {
    console.error("Error searching news:", error.message);
    res.status(500).json({ message: "Failed to search news", error: error.message });
  }
};
