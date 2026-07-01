import express from "express";
import { requireAuth } from "@clerk/express";
import { getBookMark, saveNews } from "../controllers/bookMarkController.js";

const router = express.Router();

/**
 * @swagger
 * /api/news/bookmark:
 *   get:
 *     summary: Get all bookmarks for the authenticated user
 *     tags: [Bookmarks]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarked articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookMarks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/BookMark' }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/bookmark", requireAuth(), getBookMark);

/**
 * @swagger
 * /api/news/bookmark/{newsId}:
 *   post:
 *     summary: Toggle bookmark on a news article (save/unsave)
 *     tags: [Bookmarks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bookmark removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 isBookmarked: { type: boolean, example: false }
 *       201:
 *         description: Bookmark saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookMark: { $ref: '#/components/schemas/BookMark' }
 *                 isBookmarked: { type: boolean, example: true }
 *       400:
 *         description: Invalid news ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or news not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/bookmark/:newsId", requireAuth(), saveNews);

export default router;
