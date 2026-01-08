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

import {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/agency/agency.event.js";

import {
  createScholarship,
  getAllScholarship,
  getAllScholarshipStudent,
  getAllScholarshipLanding,
  getScholarshipById,
  updateScholarship,
  deactivateScholarship,
} from "../controllers/agency/agency.scholarship.js";

//Router import
const router = express.Router();

//Auth apis
router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//Profile apis
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.get("/profile/:agencyId", protect, getAgencybyId);

//University apis
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
router.get("/courses/:courseId", protect, getCourseById);
router.get("/courses/agency/:agencyId", protect, getCourseByAgency);
//All agency
router.get("/", protect, getAllAgency);

//Profile upload
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

//Event apis
router.post("/events", protect, createEvent);
router.get("/events", protect, getAllEvents);
router.get("/events/:eventId", protect, getEvent);
router.patch("/events/:eventId", protect, updateEvent);
router.delete("/events/:eventId", protect, deleteEvent);

// Scholarships apis
router.post("/scholarships", protect, createScholarship);
router.get("/scholarships", protect, getAllScholarship);
router.get("/scholarships/:scholarshipId", protect, getScholarshipById);
router.get("/scholarships/agency/:agencyId", protect, getAllScholarshipStudent);
router.get("/scholarships/landing/", protect, getAllScholarshipLanding);
router.patch("/scholarships/:scholarshipId", protect, updateScholarship);
router.delete("/scholarships/:scholarshipId", protect, deactivateScholarship);

export default router;
