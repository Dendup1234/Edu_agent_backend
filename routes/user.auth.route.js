import express from "express";
import { login, register } from "../controllers/user.auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { redirectToGoogle, handleGoogleCallback } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/profile", protect, (req, res) => {
	res.json({
		message: "Protected route",
		user: req.user,
	});
});

router.get("/", redirectToGoogle);
router.get("/callback", handleGoogleCallback);

export default router;

