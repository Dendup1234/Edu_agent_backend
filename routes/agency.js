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
  getCourse,
  updateUni,
  deactivateUni,
} from "../controllers/agency.js";

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
router.get("/profile/:agencyId", protect, getAgencybyId);
// university apis
router.post("/universities", protect, createUni);
router.get("/universities", protect, getUni);
router.patch("/universities/:universityId", protect, updateUni);
router.delete("/universities/:universityId", deactivateUni);
//Courses apis
router.post("/universities/:universityId/courses", protect, createCourse);
router.get("/universities/:universityId/courses", protect, getCourse);

//All agency
router.get("/", protect, getAllAgency);

export default router;
