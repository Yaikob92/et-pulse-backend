import express from "express";
import {
  getAllNews,
  getNewsById,
  getChannelsPost,
  likeNews,
  repostNews,
} from "../controllers/newsController.js";
import { cleanupCorruptedInteractions } from "../controllers/cleanupController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// Public routes
router.get("/", getAllNews);
router.get("/:newsId", getNewsById);
router.get("/channel/:username", getChannelsPost);

// // Protected routes
router.post("/:newsId/like", requireAuth(), likeNews);
router.post("/:newsId/repost", requireAuth(), repostNews);
router.post("/cleanup/interactions", requireAuth(), cleanupCorruptedInteractions);

export default router;
