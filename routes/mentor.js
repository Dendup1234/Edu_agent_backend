import express from "express";
import {
  protect,
  requireVerifiedAgent,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
import {
  login,
  sendPasswordResetOtp,
  setNewPassword,
  verifyPasswordResetOtp,
} from "../controllers/mentor/mentor.auth.js";
import {
  getProfile,
  updateProfile,
} from "../controllers/mentor/mentor.profile.js";

const router = express.Router();

// Auth apis
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//profile apis
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);

export default router;
