import express from "express";
import { requireAuth } from "@clerk/express";
import { getBookMark, saveNews } from "../controllers/bookMarkController.js";

const router = express.Router();

router.get("/bookmark", requireAuth(), getBookMark);
router.post("/bookmark/:newsId", requireAuth(), saveNews);

export default router;
