import { Request, Response } from "express";
import User from "../models/User.js";
import News from "../models/News.js";
import Report from "../models/Report.js";
import Comment from "../models/Comment.js";

// --- Analytics ---
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalNews = await News.countDocuments();
        const totalComments = await Comment.countDocuments();
        const totalReports = await Report.countDocuments({ status: "pending" });

        // Aggregate views/likes from News
        const engagement = await News.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: "$likes" }
                }
            }
        ]);

        res.json({
            totalUsers,
            totalNews,
            totalComments,
            pendingReports: totalReports,
            totalViews: engagement[0]?.totalViews || 0,
            totalLikes: engagement[0]?.totalLikes || 0,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

export const getChartData = async (req: Request, res: Response) => {
    // Example: Last 7 days user signups
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const usersPerDay = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ usersPerDay });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
}

// --- User Management ---
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = {};
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { firstName: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .select("-clerkId") // Exclude sensitive info if any
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'writer', 'editor', 'user'].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to update user role" });
    }
}

export const banUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // active, banned, suspended

        const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to update user status" });
    }
}

// --- Moderation ---
export const getReports = async (req: Request, res: Response) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'username email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch reports" });
    }
}

export const resolveReport = async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: "Failed to resolve report" });
    }
}
