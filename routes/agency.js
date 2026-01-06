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
  getProfile,
  updateProfile,
  createUni,
  getUni,
  createCourse,
  getAllAgency,
  getAgencybyId,
} from "../controllers/agency.js";

import { generateSAS, confirmUpload } from "../controllers/Application.js";

// Router import
const router = express.Router();
//Auth apis
router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//profile apis
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.get("/profile/:agencyId",protect, getAgencybyId);

// university apis
router.post("/universities", protect, createUni);
router.get("/universities", protect, getUni);

//Courses apis
router.post("/universities/:universityId/courses", protect, createCourse);

//All agency
router.get("/", protect, getAllAgency);

//Profile upload
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

export default router;
