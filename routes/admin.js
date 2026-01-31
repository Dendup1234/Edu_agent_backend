import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  login,
  sendPasswordResetOtp,
  setNewPassword,
  verifyPasswordResetOtp,
} from "../controllers/admin/admin.auth.js";
import {
  getAllAdmin,
  createAdmin,
} from "../controllers/admin/admin.profile.js";
import { getAllAgency } from "../controllers/admin/admin.agency.js";

const router = express.Router();
// login api
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

// admin api
router.get("/admins", protect, getAllAdmin);
router.post("/admins", protect, createAdmin);

//agency api
router.get("/agency", protect, getAllAgency);

export default router;
