import express from "express";
import {
  getAllNews,
  getNewsById,
  getChannelsPost,
  likeNews,
  repostNews,
} from "../controllers/newsController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// Public routes
router.get("/", getAllNews);
router.get("/:newsId", getNewsById);
router.get("/channel/:channelUsername", getChannelsPost);

// // Protected routes
router.post("/:newsId/like", requireAuth(), likeNews);
router.post("/:newsId/repost", requireAuth(), repostNews);

export default router;
