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
  deactivateStudent,
} from "../controllers/student/student.profile.js";

import { searchUniByName } from "../controllers/student/student.uni.js";
import { searchCourseByName } from "../controllers/student/student.course.js";
import { searchScholarshipByName } from "../controllers/student/student.scholarship.js";
import { registerMeeting } from "../controllers/student/student.event.js";

import {
  getAllMentor,
  connectMentor,
} from "../controllers/student/student.mentor.js";

import {
  generateSAS,
  confirmUpload,
} from "../controllers/student/student.blob.js";

import { getConversationMessages } from "../controllers/message.js";

import { getApplicationStatus } from "../controllers/student/student.application.js";

import { getDocumentStatus } from "../controllers/student/student.document.js";

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
router.delete("/profile/:studentId", protect, deactivateStudent);

// When student select a particular agency
router.post("/select-agency", protect, selectAgency);

//Profile upload
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

//Course api
router.get("/courses/query/:agencyId/search", protect, searchCourseByName);

//University api
router.get("/universities/query/:agencyId/search", protect, searchUniByName);

//Event apis
router.post("/events/registration/:eventId", protect, registerMeeting);

//Scholarship
router.get(
  "/scholarships/query/:agencyId/search",
  protect,
  searchScholarshipByName,
);

// Message
router.get('/conversation/:conversationId/messages', getConversationMessages)

// Mentor apis
router.get("/mentors/:agencyId", protect, getAllMentor);
router.post("/mentors/connect/:mentorId", protect, connectMentor);
export default router;

// Get Application and Document status
router.get("/document/status", protect, getDocumentStatus);
router.get("/application/status", protect,  getApplicationStatus);