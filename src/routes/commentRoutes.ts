import express from "express";
import { getComments, addComment } from "../controllers/commentController";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// public route
router.get("/news/:newsId", getComments);

// protected route
router.post("/news/:newsId", requireAuth(), addComment);

export default router;
