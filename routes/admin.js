import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getAllAgencies,
  getAllStudents,
  deactivateStudent,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Agencies
router.get("/agencies", protect, getAllAgencies);

// Students
router.get("/students", protect, getAllStudents);
router.delete("/students/:id", protect, deactivateStudent);

export default router;
