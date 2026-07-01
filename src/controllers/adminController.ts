import { Request, Response } from "express";
import User from "../models/User.js";
import News from "../models/News.js";
import Report from "../models/Report.js";
import Comment from "../models/Comment.js";
import mongoose from "mongoose";

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalNews, totalComments, totalReports, engagement] =
      await Promise.all([
        User.countDocuments(),
        News.countDocuments(),
        Comment.countDocuments(),
        Report.countDocuments({ status: "pending" }),
        News.aggregate([
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$engagement.views" },
              totalLikes: { $sum: "$likesCount" },
            },
          },
        ]),
      ]);

    res.json({
      totalUsers,
      totalNews,
      totalComments,
      pendingReports: totalReports,
      totalViews: engagement[0]?.totalViews ?? 0,
      totalLikes: engagement[0]?.totalLikes ?? 0,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const getChartData = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersPerDay = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ usersPerDay });
  } catch (error) {
    console.error("getChartData error:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string | undefined;

    const query: any = {};
    if (search?.trim()) {
      // Use $text index if available, otherwise regex fallback
      query.$or = [
        { username: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { firstName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-clerkId") // Never expose Clerk internal IDs
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const validRoles = ["admin", "writer", "editor", "user"] as const;
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-clerkId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("updateUserRole error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const validStatuses = ["active", "banned", "suspended"] as const;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select("-clerkId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("banUser error:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

// ─── Moderation ───────────────────────────────────────────────────────────────

export const getReports = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [reports, total] = await Promise.all([
      Report.find()
        .populate("reporter", "username email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(),
    ]);

    res.json({ reports, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("getReports error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const validStatuses = ["resolved", "dismissed"] as const;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("resolveReport error:", error);
    res.status(500).json({ error: "Failed to resolve report" });
  }
};

// ─── News Management ──────────────────────────────────────────────────────────

export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, summary, content, category, coverImage, tags } = req.body;
    const currentUser = (req as any).currentUser;

    // Validate required fields
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, "") // Remove special chars except spaces/hyphens
      .trim()
      .replace(/\s+/g, "-")          // Replace spaces with hyphens
      .replace(/(^-|-$)+/g, "");     // Strip leading/trailing hyphens

    const news = new News({
      title: title.trim(),
      slug,
      summary: summary?.trim(),
      content: content.trim(),
      category,
      coverImage,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      author: currentUser._id,
      source: "cms",
      status: "published",
      publishedAt: new Date(),
    });

    await news.save();
    res.status(201).json(news);
  } catch (error: any) {
    console.error("createNews error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "A news article with this title already exists." });
    }
    res.status(500).json({ error: "Failed to create news" });
  }
};
