import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import Agency from "../models/agency.js";
import Student from "../models/student.js";

const router = express.Router();

//All agency
router.get("/", protect, async (req, res) => {
  try {
    const agency = await Agency.find().select("-password").lean();
    return res.json({
      count: agency.length,
      agency,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// All students
router.get("/", protect, async (req, res) => {
  try {
    const students = await Student.find().select("-password").lean();
    return res.json({
      count: students.length,
      students,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

//Deleting for particular user for the(only for admin)
router.delete("/:id", protect, async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  res.json({
    message: "Student deactivated",
    students: student,
  });
});

export default router;
