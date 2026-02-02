import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  login,
  sendPasswordResetOtp,
  setNewPassword,
  verifyPasswordResetOtp,
} from "../controllers/admin/admin.auth.js";
import {
  getAllAdmin,
  createAdmin,
} from "../controllers/admin/admin.profile.js";
import {
  getAllAgency,
  getAgencyStatusCount,
  deactivateAgency,
  searchAgencyByOrganizationName,
} from "../controllers/admin/admin.agency.js";

import {
  getLeadDashboard,
  getStudentLead,
  searchLeadByName,
  getStudentList,
  searchStudentByName,
} from "../controllers/admin/admin.lead.js";

import {
  getAllMentor,
  getMentorDashboard,
  searchMentorByName,
  getStudentMentorMatched,
  searchStudentMentorMatched,
} from "../controllers/admin/admin.mentor.js";
import {
  getAllEvents,
  searchEventsByName,
  getEventStatusCount,
} from "../controllers/admin/admin.event.js";

import {
  getAllUniversitiesAdmin,
  getUniDashboard,
  searchUniversitiesAdmin,
} from "../controllers/admin/admin.uni.js";
const router = express.Router();
// login api
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

// admin api
router.get("/admins", protect, getAllAdmin);
router.post("/admins", protect, createAdmin);

//agency api
router.get("/agency", protect, getAllAgency);
router.get("/agency/dashboard", protect, getAgencyStatusCount);
router.delete("/agency/:agencyId", protect, deactivateAgency);
router.get("/agency/search", protect, searchAgencyByOrganizationName);

// lead api
router.get("/leads/dashboard", protect, getLeadDashboard);
router.get("/leads", protect, getStudentLead);
router.get("/leads/search", protect, searchLeadByName);
router.get("/students/", protect, getStudentList);
router.get("/students/search", protect, searchStudentByName);

//mentor api
router.get("/mentors", protect, getAllMentor);
router.get("/mentors/dashboard", protect, getMentorDashboard);
router.get("/mentors/search", protect, searchMentorByName);
router.get("/mentors/students/", protect, getStudentMentorMatched);
router.get("/mentors/students/search", protect, searchStudentMentorMatched);

//event api
router.get("/events", protect, getAllEvents);
router.get("/events/search", protect, searchEventsByName);
router.get("/events/dashboard", protect, getEventStatusCount);

// university
router.get("/uni", protect, getAllUniversitiesAdmin);
router.get("/uni/dashboard", protect, getUniDashboard);
router.get("/uni/search", protect, searchUniversitiesAdmin);

export default router;
