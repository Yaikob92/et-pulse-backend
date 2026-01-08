import express from "express";
import { requireAuth } from "@clerk/express";
import { getBookMark } from "../controllers/bookMarkController.js";

const router = express.Router();

router.get("/news/bookmark", requireAuth(), getBookMark);

export default router;
