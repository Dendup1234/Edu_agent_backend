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
import {
  searchCourseByName,
  selectCourse,
} from "../controllers/student/student.course.js";
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

import { getDocumentStatus, getRequiredDocumentsList } from "../controllers/student/student.document.js";

export default function studentRoute(io) {
  const router = express.Router();

  // Authentication api
  router.post("/send-otp", sendOtp);
  router.post("/resend-otp", resendOtp);
  router.post("/verify-otp", verifyOtp);
  router.post("/login", login);
  router.post("/password-reset/send-otp", sendPasswordResetOtp);
  router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
  router.post("/password-reset/set-new", setNewPassword);

  // Profile
  router.get("/profile", protect, getProfile);
  router.patch("/profile", protect, updateProfile);
  router.delete("/profile/:studentId", protect, deactivateStudent);

  // Select Agency — pass io safely
  router.post("/select-agency", protect, selectAgency(io));

  // Profile upload
  router.post("/uploads/sas", protect, generateSAS);
  router.post("/uploads/confirm", protect, confirmUpload);

  // Courses / Universities / Scholarships
  router.get("/courses/query/:agencyId/search", protect, searchCourseByName);
  router.patch("/courses/select/:courseId", protect, selectCourse);
  router.get("/universities/query/:agencyId/search", protect, searchUniByName);
  router.get(
    "/scholarships/query/:agencyId/search",
    protect,
    searchScholarshipByName,
  );

  // Events
  router.post("/events/registration/:eventId", protect, registerMeeting);

  // Messages
  router.get("/conversation/:conversationId/messages", getConversationMessages);

  // Mentors
  router.get("/mentors/:agencyId", protect, getAllMentor);
  router.post("/mentors/connect/:mentorId", protect, connectMentor);

  // Application & Document status
  router.get("/document-list", protect, getRequiredDocumentsList)
  router.get("/documents/status", protect, getDocumentStatus);

  return router;
}
