import express from "express";
import {
  getAllNews,
  getNewsById,
  getChannelsPost,
  likeNews,
  repostNews,
  searchNews,
} from "../controllers/newsController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all published news with pagination & filtering
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [All, Politics, Tech, Sports, Business, World, Entertainment, Other]
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search query
 *     responses:
 *       200:
 *         description: Paginated list of news articles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", getAllNews);

/**
 * @swagger
 * /api/news/search:
 *   get:
 *     summary: Full-text search for news articles
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: Matching news articles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/News' }
 *       400:
 *         description: Search query is required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/search", searchNews);

/**
 * @swagger
 * /api/news/channel/{username}:
 *   get:
 *     summary: Get all news posts from a specific Telegram channel
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *         description: Telegram channel username
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated channel posts
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/News' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/channel/:username", getChannelsPost);

/**
 * @swagger
 * /api/news/{newsId}:
 *   get:
 *     summary: Get a single news article by ID
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the news article
 *     responses:
 *       200:
 *         description: News article detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 news: { $ref: '#/components/schemas/News' }
 *       400:
 *         description: Invalid news ID
 *       404:
 *         description: News not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/:newsId", getNewsById);

/**
 * @swagger
 * /api/news/{newsId}/like:
 *   post:
 *     summary: Toggle like on a news article (like/unlike)
 *     tags: [News]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Like toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum: [Liked, Unliked]
 *       400:
 *         description: Invalid news ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News or user not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/:newsId/like", requireAuth(), likeNews);

/**
 * @swagger
 * /api/news/{newsId}/repost:
 *   post:
 *     summary: Toggle repost on a news article (repost/unrepost)
 *     tags: [News]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Repost toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum: [Reposted, Unreposted]
 *       400:
 *         description: Invalid news ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News or user not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/:newsId/repost", requireAuth(), repostNews);

export default router;
