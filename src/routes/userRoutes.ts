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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/UserFull' }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/me", requireAuth(), getCurrentUser);

/**
 * @swagger
 * /api/user/sync:
 *   post:
 *     summary: Sync Clerk user into the local database (call after first login)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/UserFull' }
 *                 message: { type: string }
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/UserFull' }
 *                 message: { type: string }
 *       400:
 *         description: User has no email address
 *       401:
 *         description: Unauthorized
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/sync", requireAuth(), syncUser);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user first and last name
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/UserFull' }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/profile", requireAuth(), updateUserProfile);

/**
 * @swagger
 * /api/user/profile/picture:
 *   post:
 *     summary: Upload or replace the user's profile picture
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (max 5 MB)
 *     responses:
 *       200:
 *         description: Profile picture updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/UserFull' }
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/profile/picture",
  requireAuth(),
  upload.single("image"),
  uploadProfilePicture
);

export default router;
