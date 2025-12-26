import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { redirectToGoogle, handleGoogleCallback } from "../controllers/oAuth.js";
import { sendOtp,resendOtp, verifyOtp, login, sendPasswordResetOtp, verifyPasswordResetOtp, setNewPassword } from "../controllers/auth.controller.js"
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/profile", protect, (req, res) => {
	res.json({
		message: "Protected route",
		user: req.user,
	});
});
router.post("/password-reset/send-otp", sendPasswordResetOtp);   
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);         

export default router;

