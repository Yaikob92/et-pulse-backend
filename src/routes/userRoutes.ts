import express from "express";
import {
  getCurrentUser,
  syncUser,
  updateUserProfile,
  uploadProfilePicture,
} from "../controllers/userController.js";
import { requireAuth } from "@clerk/express";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// protected routes
router.put("/profile", requireAuth(), updateUserProfile);
router.post(
  "/profile/picture",
  requireAuth(),
  upload.single("image"),
  uploadProfilePicture
);
router.get("/me", requireAuth(), getCurrentUser);
router.post("/sync", requireAuth(), syncUser);

export default router;
