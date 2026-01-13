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
} from "../controllers/agent/agent.auth.js";
import { getAllStudent } from "../controllers/agent/agent.profile.js";
const router = express.Router();

router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//admission officers apis
router.get(
  "/students/",
  protect,
  requireVerifiedAgent,
  authorizeRoles("admission_officer"),
  getAllStudent
);

export default router;
