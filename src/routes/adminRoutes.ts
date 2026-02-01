import express from "express";
import { requireAdmin } from "../middleware/auth.middleware.js";
import {
    getDashboardStats,
    getChartData,
    getAllUsers,
    updateUserRole,
    banUser,
    getReports,
    resolveReport
} from "../controllers/adminController.js";

const router = express.Router();

// Apply admin check to all routes
router.use(requireAdmin);

// Analytics
router.get("/stats", getDashboardStats);
router.get("/analytics", getChartData);

// Users
router.get("/users", getAllUsers);
router.put("/users/:userId/role", updateUserRole);
router.put("/users/:userId/status", banUser);

// Moderation
router.get("/reports", getReports);
router.put("/reports/:reportId", resolveReport);

export default router;
