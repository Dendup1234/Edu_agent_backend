import express from "express";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
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
  getCourseById,
} from "../controllers/agency/agency.course.js";

import {
  getProfile,
  updateProfile,
  getAgencybyId,
  getAllAgency,
  getLeadDashboard,
  getStudentLead,
  getStudentAppStatus,
  getStudentList,
  searchLeadByName,
  getAgencyCard,
} from "../controllers/agency/agency.profile.js";

import {
  createUni,
  getUni,
  updateUni,
  deactivateUni,
  getUniById,
  getUniStudent,
  searchUniByName,
  getUniDashboard,
} from "../controllers/agency/agency.uni.js";

import {
  generateSAS,
  confirmUpload,
} from "../controllers/agency/agency.blob.js";

import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEventsStudent,
  searchEventsByName,
  assigningSeatTypes,
  createTicketType,
  updateTicketType,
  getAllTicket,
  getSeatInformation,
  updateSeatType,
  getTickets,
  searchTickets,
} from "../controllers/agency/agency.event.js";

import {
  createScholarship,
  getAllScholarship,
  getAllScholarshipStudent,
  getAllScholarshipLanding,
  getScholarshipById,
  updateScholarship,
  deactivateScholarship,
  searchScholarshipByName,
  getScholarshipDashboard,
} from "../controllers/agency/agency.scholarship.js";

import {
  createAgent,
  getAllAgent,
  getAgentById,
  createRole,
  getAllRole,
  updateRole,
  deactivateRole,
  searchEmployee,
  updateAgent,
  createMentor,
  searchRoleByName,
  getAllAdmissionOfficer,
  assignAdmission,
  changeAssignedAgent,
  deactivateAgent,
} from "../controllers/agency/agency.employee.js";

import { getConversationMessages } from "../controllers/message.js";

import { getDocumentsByStudent } from "../controllers/agency/agency.document.js";

import {
  getAllMentor,
  getMentorById,
  deactivateMentor,
  searchMentorByName,
  getMentorDashboard,
} from "../controllers/agency/agency.mentor.js";

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
router.get("/profile/dashboard/leads/", protect, getLeadDashboard);
router.get("/profile/students/leads/", protect, getStudentLead);
router.get("/profile/students/leads/:studentId", protect, getStudentAppStatus);
router.get("/profile/students/leads/query/search", protect, searchLeadByName);
router.get("/profile/students/studentlist", protect, getStudentList);
router.get("/profile/students/card", protect, getAgencyCard);

//University apis
router.post(
  "/universities",
  protect,
  requirePermission("university:create"),
  createUni,
);
router.get(
  "/universities",
  protect,
  requirePermission("university:read"),
  getUni,
);
router.patch(
  "/universities/:universityId",
  protect,
  requirePermission("university:update"),
  updateUni,
);
router.delete(
  "/universities/:universityId",
  protect,
  requirePermission("university:delete"),
  deactivateUni,
);
router.get(
  "/universities/:universityId",
  protect,
  requirePermission("university:readById"),
  getUniById,
);
router.get("/universities/agency/:agencyId", protect, getUniStudent);
router.get(
  "/universities/query/search",
  protect,
  requirePermission("university:search"),
  searchUniByName,
);
router.get(
  "/universities/dashboard/unipage",
  protect,
  requirePermission("university:dashboard"),
  getUniDashboard,
);

//Courses apis
router.post(
  "/universities/:universityId/courses",
  protect,
  requirePermission("course:create"),
  createCourse,
);

router.get(
  "/universities/:universityId/courses",
  protect,
  requirePermission("course:read"),
  getCourse,
);

router.patch(
  "/universities/:universityId/courses/:courseId",
  protect,
  requirePermission("course:update"),
  updateCourse,
);

router.delete(
  "/universities/:universityId/courses/:courseId",
  protect,
  requirePermission("course:delete"),
  deactivateCourse,
);

router.get(
  "/courses/:courseId",
  protect,
  requirePermission("course:readById"),
  getCourseById,
);

//All agency
//Student api
router.get("/", protect, getAllAgency);

//Profile upload
router.post("/uploads/sas", protect, generateSAS);
router.post("/uploads/confirm", protect, confirmUpload);

//Event apis
router.post("/events", protect, requirePermission("event:create"), createEvent);
router.get("/events", protect, requirePermission("event:read"), getAllEvents);
router.get(
  "/events/profile/:eventId",
  protect,
  requirePermission("event:readById"),
  getEventById,
);
router.get("/events/student/:agencyId", protect, getAllEventsStudent);
router.patch(
  "/events/profile/:eventId",
  protect,
  requirePermission("event:update"),
  updateEvent,
);
router.delete(
  "/events/profile/:eventId",
  protect,
  requirePermission("event:delete"),
  deleteEvent,
);
router.get(
  "/events/profile/query/search",
  protect,
  requirePermission("event:search"),
  searchEventsByName,
);
// new permission not assigned
router.post(
  "/events/profile/:eventId/seats",
  protect,
  requirePermission("event:seat"),
  assigningSeatTypes,
);
router.patch(
  "/events/profile/:eventId/seats/:seatId/update",
  protect,
  updateSeatType,
);
router.post(
  "/events/profile/:eventId/tickets",
  protect,
  requirePermission("event:createTicket"),
  createTicketType,
);
router.patch(
  "/events/profile/:eventId/tickets/:ticketId",
  protect,
  requirePermission("event:updateTicket"),
  updateTicketType,
);
router.get(
  "/events/profile/:eventId/tickets/",
  protect,
  requirePermission("event:readTicket"),
  getAllTicket,
);
router.get("/events/profile/:seatId/seats/info", protect, getSeatInformation);
router.get("/events/tickets/", protect, getTickets);
router.get("/events/tickets/search", protect, searchTickets);

// Scholarships apis
router.post(
  "/scholarships",
  protect,
  requirePermission("scholarship:create"),
  createScholarship,
);
router.get(
  "/scholarships",
  protect,
  requirePermission("scholarship:read"),
  getAllScholarship,
);
router.get(
  "/scholarships/:scholarshipId",
  protect,
  requirePermission("scholarship:readById"),
  getScholarshipById,
);
router.get(
  "/scholarships/agency/:agencyId",
  protect,
  requirePermission("scholarship:byAgency"),
  getAllScholarshipStudent,
);
router.get("/scholarships/landing/scholarships/", getAllScholarshipLanding);
router.patch(
  "/scholarships/:scholarshipId",
  protect,
  requirePermission("scholarship:update"),
  updateScholarship,
);
router.delete(
  "/scholarships/:scholarshipId",
  protect,
  requirePermission("scholarship:delete"),
  deactivateScholarship,
);
router.get(
  "/scholarships/query/search",
  protect,
  requirePermission("scholarship:search"),
  searchScholarshipByName,
);
router.get(
  "/scholarships/dashboard/scholarships",
  protect,
  requirePermission("scholarship:dashboard"),
  getScholarshipDashboard,
);

//Employees apis
router.post("/profile/employee/agents", protect, createAgent);
router.get("/profile/employee/agents", protect, getAllAgent);
router.get("/profile/employee/agents/:agentId/agents", protect, getAgentById);
router.patch("/profile/employee/agents/:agentId/agents", protect, updateAgent);
router.delete(
  "/profile/employee/agents/:agentId/agents",
  protect,
  deactivateAgent,
);
router.post("/profile/role/agents", protect, createRole);
router.get("/profile/role/agents", protect, getAllRole);
router.patch("/profile/role/agents/:roleId", protect, updateRole);
router.delete("/profile/role/agents/:roleId", protect, deactivateRole);
router.get("/profile/employee/agents/search/", protect, searchEmployee);
router.post("/profile/employee/mentors", protect, createMentor);
router.get("/profile/role/search", protect, searchRoleByName);
router.get(
  "/profile/employee/admission-officers",
  protect,
  getAllAdmissionOfficer,
);
router.patch("/profile/assign/:studentId", protect, assignAdmission);
router.patch("/profile/assign/change/:studentId", protect, changeAssignedAgent);

// Message
router.get("/conversation/:conversationId/messages", getConversationMessages);

// Mentor apis
router.get("/mentors/", protect, getAllMentor);
router.get("/mentors/:mentorId", protect, getMentorById);
router.delete("/mentors/:mentorId", protect, deactivateMentor);
router.get("/mentors/search/query", protect, searchMentorByName);
router.get("/mentors/dashboard/stats", protect, getMentorDashboard);

// Documents
router.get("/documents/:studentId", getDocumentsByStudent);

export default router;
