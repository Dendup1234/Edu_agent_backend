import express from "express";
//import { login, register } from "../controllers/user.auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
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



export default router;
