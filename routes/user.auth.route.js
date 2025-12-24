import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { redirectToGoogle, handleGoogleCallback } from "../controllers/oAuth.js";
import { sendOrResendOtp, verifyOtp, login } from "../controllers/auth.controller.js"
const router = express.Router();

router.post("/send-otp", sendOrResendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/profile", protect, (req, res) => {
	res.json({
		message: "Protected route",
		user: req.user,
	});
});

router.get("/", redirectToGoogle);
router.get("/google/callback", handleGoogleCallback);

export default router;

