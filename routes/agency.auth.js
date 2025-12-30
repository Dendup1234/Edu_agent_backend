import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { sendOtp,resendOtp, verifyOtp, login, sendPasswordResetOtp, verifyPasswordResetOtp, setNewPassword } from "../controllers/agency.auth.js"
import Agency from "../models/agency.js"
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);   
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);   

router.get("/profile", protect, async (req, res) => {
  try {
    const user_id = req.user.sub;
    //Hides password and return plain json format
    const student = await Agency.findById(user_id).select("-password").lean();
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      profile: student,
      tokenUser: { userId: user_id, email: req.user.email },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

