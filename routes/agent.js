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
} from "../controllers/agent/agent.profile.js";
const router = express.Router();

import {
  getDocumentsByStudent,
  updateDocumentReviewStatus,
} from "../controllers/agency/agency.document.js";

import { 
  getStudentApplication, 
  updateStageStatus
} from "../controllers/agency/agency.application.js";

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
router.get("/documents/:studentId", protect, getDocumentsByStudent);
router.patch("/documents/:documentId/review-status", protect, updateDocumentReviewStatus);

// Application 
router.get("/application/:studentId", protect, getStudentApplication)
router.patch("/application/:applicationId/stage", protect, updateStageStatus)

export default router;