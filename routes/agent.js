import express from "express";
import {
  protect,
  requireVerifiedAgent,
  authorizeRoles,
  verifyInternalToken,
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
  updateProfile,
} from "../controllers/agent/agent.profile.js";
const router = express.Router();

import {
  createRequiredDocument,
  updateRequiredDocument,
  getRequiredDocumentsList,
  getDocumentsByStudent,
  getStudentChecklist,
  updateDocumentReviewStatus,
  deleteRequiredDocument,
  getAgentStudentCount,
} from "../controllers/agent/agent.requiredDocument.js";

import { generateSAS, confirmUpload } from "../controllers/agent/agent.blob.js";

import {
  createStudentChecklist,
  deleteStudentRequiredDocument,
} from "../controllers/agent/agent.studentRequiredDocument.js";

import { getVisaAgent } from "../controllers/agent/agent.visaofficerlist.js";

import {
  getDocumentFraudContext,
  updateDocumentFraudResult,
} from "../controllers/agent/agent.fraudCheck.js";

// Auth apis
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//Profile apis
router.get("/profile/me", protect, getAgentinformation);
router.patch("/profile/update", protect, updateProfile);

// admission officers apis
router.get("/students", protect, getStudentList);

// Document
router.post("/documents/required", protect, createRequiredDocument);
router.get("/documents/required", protect, getRequiredDocumentsList);
router.patch("/documents/required/:id", protect, updateRequiredDocument);
router.get("/documents/student/:studentId", protect, getDocumentsByStudent);
router.delete("/documents/required/:id", protect, deleteRequiredDocument);

router.post("/documents/checklist/:studentId", protect, createStudentChecklist);
router.get("/documents/checklist/:studentId", protect, getStudentChecklist);
router.patch(
  "/documents/review/:studentRequiredDocumentId",
  protect,
  updateDocumentReviewStatus,
);
router.delete(
  "/documents/checklist/:studentRequiredDocumentId",
  protect,
  deleteStudentRequiredDocument,
);

// uploads
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

// appointment apis
router.post("/appointments", protect, createAppointment);
router.get("/appointments", protect, getAppointments);
router.patch(
  "/appointments/:appointmentId/update",
  protect,
  updateAppointments,
);
router.patch("/appointments/:appointmentId/cancel", protect, cancelAppointment);
router.patch(
  "/appointments/:appointmentId/complete",
  protect,
  confirmedAppointment,
);
router.get("/appointments/search/", protect, searchAppointmentsByStudentName);

router.get("/agent-list", protect, getVisaAgent);

router.get("/studentcount", protect, getAgentStudentCount);

// Document fraud checking
router.get(
  "/student-required-documents/:studentRequiredDocumentId/fraud-context",
  verifyInternalToken,
  getDocumentFraudContext,
);
router.patch(
  "/student-required-documents/:studentRequiredDocumentId/fraud-result",
  verifyInternalToken,
  updateDocumentFraudResult,
);

export default router;
