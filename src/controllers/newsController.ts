import News from "../models/News.js";
import { Request, Response } from "express";
import Interaction from "../models/Interaction.js";
import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import mongoose from "mongoose";

// Get all news with pagination
export const getAllNews = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10)
  );
  const skip = (page - 1) * limit;

  const { userId } = getAuth(req);
  let userObjectId: mongoose.Types.ObjectId | null = null;
  const collectionName = Interaction.collection.name;

  console.log("getAllNews called:", { userId, collectionName });

  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    if (user) {
      userObjectId = user._id as mongoose.Types.ObjectId;
      console.log("Found userObjectId:", userObjectId);
    }
  }

  const news = await News.aggregate([
    { $sort: { createdAt: -1 } },
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
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: userObjectId
          ? { $in: [userObjectId, "$likes.user"] }
          : false,
        likesDebug: "$likes" // Keep this temporary for debugging if possible
      },
    },
    { $project: { likes: 0 } },
  ]);

  if (news.length > 0) {
    console.log("Sample isLiked results:", news.slice(0, 3).map(n => ({ id: n._id, isLiked: n.isLiked, likesCount: n.likesCount })));
  }

  const populatedNews = await News.populate(news, {
    path: "comments",
    populate: {
      path: "user",
      select: "username firstName lastName profilePicture",
    },
  });

  const total = await News.countDocuments();

  res.status(200).json({
    news: populatedNews,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalNews: total,
  });
};

export const getChannelsPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10)
  );
  const skip = (page - 1) * limit;
  const { username } = req.params;
  const collectionName = Interaction.collection.name;

  const { userId } = getAuth(req);
  let userObjectId: mongoose.Types.ObjectId | null = null;

  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    if (user) {
      userObjectId = user._id as mongoose.Types.ObjectId;
    }
  }

  const news = await News.aggregate([
    { $match: { channelUsername: username } },
    { $sort: { createdAt: -1 } },
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
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: userObjectId
          ? { $in: [userObjectId, "$likes.user"] }
          : false,
      },
    },
    { $project: { likes: 0 } },
  ]);

  const total = await News.countDocuments({ channelUsername: username });

  res.status(200).json({
    news,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalNews: total,
  });
};

export const getNewsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { newsId } = req.params;

  const { userId } = getAuth(req);
  let userObjectId: mongoose.Types.ObjectId | null = null;

  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    if (user) {
      userObjectId = user._id as mongoose.Types.ObjectId;
    }
  }

  const news = await News.findById(newsId).populate({
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

  res.status(200).json({
    news: {
      ...news.toObject(),
      likesCount,
      isLiked,
    },
  });
};

// Like a news item
export const likeNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const { newsId } = req.params;

    console.log("likeNews called:", { userId, newsId, params: req.params });

    if (!userId) {
      console.log("No userId found, returning 401");
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validate newsId
    if (!newsId) {
      console.log("No newsId found, returning 400");
      res.status(400).json({ message: "News ID is required" });
      return;
    }

    // Get MongoDB user from Clerk userId
    const user = await User.findOne({ clerkId: userId });
    console.log("User lookup result:", { clerkId: userId, foundUser: !!user, userId: user?._id });

    if (!user) {
      console.log("User not found in database, returning 404");
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Validate user has _id
    if (!user._id) {
      console.log("User record has no _id, returning 500");
      res.status(500).json({ message: "User record is invalid" });
      return;
    }

    // Verify news exists
    const news = await News.findById(newsId);
    console.log("News lookup result:", { newsId, foundNews: !!news });

    if (!news) {
      console.log("News not found, returning 404");
      res.status(404).json({ message: "News not found" });
      return;
    }

    const existingInteraction = await Interaction.findOne({
      user: user._id,
      news: newsId,
      type: "like",
    });

    console.log("Existing interaction:", { exists: !!existingInteraction });

    if (existingInteraction) {
      // Unlike
      console.log("Unliking news:", { userId: user._id, newsId });
      await Interaction.findByIdAndDelete(existingInteraction._id);

      res.json({ message: "Unliked" });
    } else {
      // Like
      console.log("Liking news - creating interaction:", { userId: user._id, newsId, type: "like" });
      await Interaction.create({
        user: user._id,
        news: newsId,
        type: "like",
      });
      res.json({ message: "Liked" });
    }
  } catch (error: any) {
    console.error("Error in likeNews:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({
      message: "Failed to like news",
      error: error.message
    });
  }
};

// Repost a news item
export const repostNews = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    user: user._id,
    news: newsId,
    type: "repost",
  });

  if (existingInteraction) {
    // Un-repost
    await Interaction.findByIdAndDelete(existingInteraction._id);
    res.json({ message: "Unreposted" });
  } else {
    // Repost
    await Interaction.create({
      user: user._id,
      news: newsId,
      type: "repost",
    });
    res.json({ message: "Reposted" });
  }
};
