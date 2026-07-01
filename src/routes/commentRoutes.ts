import express from "express";
import {
    getComments,
    addComment,
    addReply,
    likeComment,
} from "../controllers/commentController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

/**
 * @swagger
 * /api/comment/news/{newsId}:
 *   get:
 *     summary: Get all comments for a news article
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Comment' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/news/:newsId", getComments);

/**
 * @swagger
 * /api/comment/news/{newsId}:
 *   post:
 *     summary: Add a comment to a news article
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1 }
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Comment' }
 *       400:
 *         description: Comment content is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or news not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/news/:newsId", requireAuth(), addComment);

/**
 * @swagger
 * /api/comment/{commentId}/reply:
 *   post:
 *     summary: Reply to an existing comment
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1 }
 *     responses:
 *       201:
 *         description: Reply created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Comment' }
 *       400:
 *         description: Reply content is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or parent comment not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/:commentId/reply", requireAuth(), addReply);

/**
 * @swagger
 * /api/comment/{commentId}/like:
 *   post:
 *     summary: Toggle like on a comment
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
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
 *                 message: { type: string, enum: [Liked, Unliked] }
 *                 likesCount: { type: integer }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/:commentId/like", requireAuth(), likeComment);

export default router;
