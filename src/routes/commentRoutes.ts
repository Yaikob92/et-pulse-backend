import express from "express";
import {
    getComments,
    addComment,
    addReply,
    likeComment,
} from "../controllers/commentController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// public route
router.get("/news/:newsId", getComments);

// protected route
router.post("/news/:newsId", requireAuth(), addComment);
router.post("/:commentId/reply", requireAuth(), addReply);
router.post("/:commentId/like", requireAuth(), likeComment);

export default router;
