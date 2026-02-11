import { chatbotStream } from "../controllers/chat.js";
import { protect } from "../middlewares/auth.middleware.js";
import express from "express";

const router = express.Router();

// chatbots api
router.post("/chatbot", chatbotStream);

export default router;
