import { Request, Response } from "express";
import BookMarks from "../models/BookMarks.js";
import News from "../models/News.js";
import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import mongoose from "mongoose";

export const getBookMark = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const bookMarks = await BookMarks.find({ user: user?._id })
      .populate("news")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookMarks });
  } catch (error: any) {
    console.error("Error fetching bookmarks:", error.message);
    res.status(500).json({ message: "Failed to fetch bookmarks", error: error.message });
  }
};

export const saveNews = async (req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    const news = await News.findById(newsId);
    if (!news) {
      res.status(404).json({ error: "News not found" });
      return;
    }

    const existing = await BookMarks.findOne({ user: user._id, news: newsId });
    if (existing) {
      await BookMarks.findByIdAndDelete(existing._id);
      res.status(200).json({ message: "Bookmark removed", isBookmarked: false });
      return;
    }

    const bookMark = await BookMarks.create({ user: user._id, news: newsId });
    res.status(201).json({ bookMark, isBookmarked: true });
  } catch (error: any) {
    console.error("Error saving bookmark:", error.message);
    res.status(500).json({ message: "Failed to save bookmark", error: error.message });
  }
};
