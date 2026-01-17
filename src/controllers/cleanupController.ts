import { Request, Response } from "express";
import Interaction from "../models/Interaction.js";

// Cleanup corrupted interaction records
export const cleanupCorruptedInteractions = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Delete any interactions with null user or news
        const result = await Interaction.deleteMany({
            $or: [{ user: null }, { news: null }],
        });

        res.json({
            message: "Cleanup completed",
            deletedCount: result.deletedCount,
        });
    } catch (error: any) {
        console.error("Error in cleanupCorruptedInteractions:", error);
        res.status(500).json({
            message: "Failed to cleanup interactions",
            error: error.message,
        });
    }
};
