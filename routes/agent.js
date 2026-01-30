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

import {
  getAgentinformation,
  getStudentList,
  createAppointment,
  getAppointments,
  updateAppointments,
  cancelAppointment,
  confirmedAppointment,
  searchAppointmentsByStudentName,
} from "../controllers/agent/agent.profile.js";
const router = express.Router();

import {
  getDocumentsByStudent,
  updateDocumentReviewStatus,
  createRequiredDocument,
  getRequiredDocumentsList
} from "../controllers/agent/agent.document.js";

import {
  generateSAS,
  confirmUpload
} from "../controllers/agent/agent.blob.js"

// Auth apis
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//Profile apis
router.get("/profile/me", protect, getAgentinformation);

// admission officers apis
router.get("/students", protect, getStudentList);

// Document
router.get("/documents/types", protect, getRequiredDocumentsList)
router.post("/documents/required", protect, createRequiredDocument);
router.get("/documents/:studentId", protect, getDocumentsByStudent);
router.patch("/documents/:documentId/review-status", protect, updateDocumentReviewStatus);

// Uploads
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

export default router;
