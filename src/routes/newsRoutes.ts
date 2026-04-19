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

// Public routes
router.get("/", getAllNews);
router.get("/search", searchNews);
router.get("/channel/:username", getChannelsPost);
router.get("/:newsId", getNewsById);

// Protected routes
router.post("/:newsId/like", requireAuth(), likeNews);
router.post("/:newsId/repost", requireAuth(), repostNews);

export default router;
