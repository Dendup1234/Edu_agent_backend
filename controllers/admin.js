import Agency from "../models/agency.js";
import Student from "../models/student.js";

//Get all agency
export const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find()
      .select("-password")
      .lean();

    return res.json({
      count: agencies.length,
      agencies,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Get all the students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("-password")
      .lean();

    return res.json({
      count: students.length,
      students,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Deactivate the student
export const deactivateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      message: "Student deactivated",
      student,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
