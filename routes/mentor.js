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
} from "../controllers/mentor/mentor.auth.js";
import {
  getProfile,
  updateProfile,
  getStudentConfirmed,
  getStudentPending,
  confirmMenteeStatus,
  cancelMenteeStatus,
  createAppointment,
  getAppointments,
  updateAppointments,
  cancelAppointment,
  confirmedAppointment,
} from "../controllers/mentor/mentor.profile.js";

const router = express.Router();

// Auth apis
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//profile apis
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);

//Students apis
router.get("/mentees/confirmed", protect, getStudentConfirmed);
router.get("/mentees/pending", protect, getStudentPending);
router.patch("/mentees/:studentId/confirmed", protect, confirmMenteeStatus);
router.patch("/mentees/:studentId/cancelled", protect, cancelMenteeStatus);

//Appointment apis
router.post("/appointments", protect, createAppointment);
router.get("/appointments", protect, getAppointments);
router.patch(
  "/appointments/:appointmentId/update",
  protect,
  updateAppointments,
);
router.patch("/appointments/:appointmentId/cancel", protect, cancelAppointment);
router.patch(
  "/appointments/:appointmentId/confirmed",
  protect,
  confirmedAppointment,
);

export default router;
