import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  sendOtp,
  resendOtp,
  verifyOtp,
  login,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  setNewPassword,
} from "../controllers/student/student.auth.js";
import {
  getProfile,
  updateProfile,
  selectAgency,
} from "../controllers/student/student.profile.js";

const router = express.Router();

//For authentication
router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//Profile section
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);

// When student select a particular agency
router.post("/select-agency", protect, selectAgency);

//Course

//router.post("/select-course",protect,)

export default router;
