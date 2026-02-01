import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { getAuth } from "@clerk/express";

// Middleware to ensure user is authenticated
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
};

// Middleware to ensure user is an admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await User.findOne({ clerkId: auth.userId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ error: "Forbidden: Admin access only" });
        }

        // Attach user to request for convenience in controllers
        (req as any).currentUser = user;

        next();
    } catch (error) {
        console.error("Admin check error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
