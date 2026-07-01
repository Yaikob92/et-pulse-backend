import express from "express";
import { handleWebhook } from "../controllers/webhookController.js";

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/clerk:
 *   post:
 *     summary: Receive Clerk webhook events (user.created, user.deleted)
 *     tags: [Webhooks]
 *     description: >
 *       This endpoint is called by Clerk via Svix. It verifies the webhook
 *       signature and forwards the event to Inngest for async processing.
 *       **Do not call this directly.**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Clerk webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Missing or invalid Svix headers / verification failed
 *       500:
 *         description: Error forwarding event to Inngest
 */
router.post("/clerk", handleWebhook);

export default router;
