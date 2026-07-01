import express from "express";
import { requireAdmin } from "../middleware/auth.middleware.js";
import {
    getDashboardStats,
    getChartData,
    getAllUsers,
    updateUserRole,
    banUser,
    getReports,
    resolveReport,
    createNews
} from "../controllers/adminController.js";

const router = express.Router();

// Apply admin check to all routes in this router
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated platform statistics
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DashboardStats' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/stats", getDashboardStats);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get user registration chart data for the past 7 days (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daily registration counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usersPerDay:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string, example: '2024-01-15' }
 *                       count: { type: integer }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/analytics", getChartData);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users with pagination and search (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by username, email, or first name
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/UserFull' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 pages: { type: integer }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Change a user's role (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, writer, editor, user]
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserFull' }
 *       400:
 *         description: Invalid role value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/users/:userId/role", updateUserRole);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Ban or suspend a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, banned, suspended]
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserFull' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/users/:userId/status", banUser);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get all content reports (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Report' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/reports", getReports);

/**
 * @swagger
 * /api/admin/reports/{reportId}:
 *   put:
 *     summary: Resolve or dismiss a report (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [resolved, dismissed]
 *     responses:
 *       200:
 *         description: Report updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Report' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/reports/:reportId", resolveReport);

/**
 * @swagger
 * /api/admin/news:
 *   post:
 *     summary: Manually create/publish a news article from the CMS (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateNewsBody' }
 *     responses:
 *       201:
 *         description: News article created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/News' }
 *       400:
 *         description: Slug collision — duplicate title
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/news", createNews);

export default router;
