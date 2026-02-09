import { openAiChat } from "../controllers/chat.js";
import { protect } from "../middlewares/auth.middleware.js";
import express from "express";

const router = express.Router();

// chatbot api
router.post("/chatbot", protect, openAiChat);

export default router;
