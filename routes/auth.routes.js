import express from "express";
import { login } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);

router.get("/profile", protect, (req, res) => {
	res.json({
		message: "Protected route",
		user: req.user,
	});
});

export default router;
