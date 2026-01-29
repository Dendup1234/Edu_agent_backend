import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  login,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  setNewPassword,
} from "../controllers/admin/admin.auth.js";
import {
  createAdmin,
  getAllAdmin,
} from "../controllers/admin/admin.profile.js";
const router = express.Router();

// auth apis
router.post("/login", login);
router.post("/password/send-otp", sendPasswordResetOtp);
router.post("/password/verify-otp", verifyPasswordResetOtp);
router.post("/password/set-new", setNewPassword);

// Admin dashboard
router.post("/admins", protect, createAdmin);
router.get("/admins", protect, getAllAdmin);

export default router;
