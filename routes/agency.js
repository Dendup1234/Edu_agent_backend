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
} from "../controllers/agency/agency.auth.js";

import {
  createCourse,
  getCourse,
  updateCourse,
  deactivateCourse,
  getCourseByAgency,
  getCourseById,
} from "../controllers/agency/agency.course.js";

import {
  getProfile,
  updateProfile,
  getAgencybyId,
  getAllAgency,
} from "../controllers/agency/agency.profile.js";

import {
  createUni,
  getUni,
  updateUni,
  deactivateUni,
  getUniById,
} from "../controllers/agency/agency.uni.js";

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
router.get("/profile/:agencyId", protect, getAgencybyId);
// university apis
router.post("/universities", protect, createUni);
router.get("/universities", protect, getUni);
router.patch("/universities/:universityId", protect, updateUni);
router.delete("/universities/:universityId", protect, deactivateUni);
router.get("/universities/:universityId", protect, getUniById);
//Courses apis
router.post("/universities/:universityId/courses", protect, createCourse);
router.get("/universities/:universityId/courses", protect, getCourse);
router.patch(
  "/universities/:universityId/courses/:courseId",
  protect,
  updateCourse
);
router.delete(
  "/universities/:universityId/courses/:courseId",
  protect,
  deactivateCourse
);
router.get(
  "/universities/courses/:courseId",
  protect,
  getCourseById
);
router.get("/courses/:agencyId", protect, getCourseByAgency);
//All agency
router.get("/", protect, getAllAgency);

//Profile upload
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

export default router;
