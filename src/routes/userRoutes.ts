import express from "express";
import {
  followNews,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateUserProfile,
} from "../controllers/userController";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// public route
router.get("/profile/:username", getUserProfile);

// protected routes
router.put("/profile", requireAuth(), updateUserProfile);
router.get("/me", requireAuth(), getCurrentUser);
router.post("/sync", requireAuth(), syncUser);
router.post("/follow/:newsId", requireAuth(), followNews);

export default router;
