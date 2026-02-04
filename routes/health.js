import express from "express";

const router = express.Router();

// health checkup api
router.get("/health", (req, res) => res.json({ ok: true }));

export default router;
