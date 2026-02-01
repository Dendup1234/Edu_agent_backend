import Mentor from "../../models/mentor.js";
import Student from "../../models/student.js";

// Getting all the mentor from the agency with mentees count
export const getAllMentor = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    //finding mentor connected to the specific mentors
    const mentors = await Mentor.find().populate({
      path: "partnerAgency",
      select: "organizationName",
    });
    // finding the mentees count
    const mentorsWithMenteeCount = mentors.map((mentor) => ({
      ...mentor.toObject(),
      menteeCount: mentor.mentees.length,
    }));
    return res.status(200).json({
      message: "Successful",
      mentors: mentorsWithMenteeCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Dashboard to show the mentor active and inactive count
export const getMentorDashboard = async (req, res) => {
  try {
    // Active mentors = isActive true AND isVerified true
    const activeMentorCount = await Mentor.countDocuments({
      isActive: true,
      isVerified: true,
    });

    // Inactive mentors = all others that do NOT satisfy both conditions
    const inActiveMentorCount = await Mentor.countDocuments({
      $or: [{ isActive: false }, { isVerified: false }],
    });
    //Success
    return res.status(200).json({
      message: "Success",
      activeMentorCount: activeMentorCount,
      InActiveMentorCount: inActiveMentorCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Searching mentor api
export const searchMentorByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Name is required for search" });
    }

    const mentors = await Mentor.find({
      name: { $regex: name, $options: "i" },
    }).populate({
      path: "partnerAgency",
      select: "organizationName",
    });

    const mentorsWithMenteeCount = mentors.map((mentor) => ({
      ...mentor.toObject(),
      menteeCount: mentor.mentees.length,
    }));

    return res.status(200).json({
      message: "Search successful",
      total: mentorsWithMenteeCount.length,
      mentors: mentorsWithMenteeCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting mentor matched
export const getStudentMentorMatched = async (req, res) => {
  try {
    const students = await Student.find({
      isValid: true,
      connectedMentor: { $ne: null },
    })
      .select(
        "name registeredAgency selectedCourse selectedUniversity  createdAt",
      )
      .populate({ path: "registeredAgency", select: "organizationName" })
      .populate({ path: "selectedCourse", select: "title" })
      .populate({ path: "selectedUniversity", select: "name country" })
      .populate({ path: "connectedMentor", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    const rows = students.map((s, index) => ({
      id: String(index + 1).padStart(2, "0"),
      studentName: s.name,
      agency: s.registeredAgency?.organizationName || null,
      course: s.selectedCourse?.title || null,
      university: s.selectedUniversity?.name || null,
      country: s.selectedUniversity?.country || null,
      chosenMentor: s.connectedMentor?.name || null,
      studentId: s._id,
    }));

    return res.status(200).json({
      message: "Success",
      total: rows.length,
      rows,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Searching api from student name
export const searchStudentMentorMatched = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "Query param 'q' is required" });
    }

    const students = await Student.find({
      isValid: true,
      connectedMentor: { $ne: null },
      name: { $regex: q, $options: "i" },
    })
      .select(
        "name registeredAgency selectedCourse selectedUniversity connectedMentor createdAt",
      )
      .populate({ path: "registeredAgency", select: "organizationName" })
      .populate({ path: "selectedCourse", select: "title" })
      .populate({ path: "selectedUniversity", select: "name country" })
      .populate({ path: "connectedMentor", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    const rows = students.map((s, index) => ({
      id: String(index + 1).padStart(2, "0"),
      studentName: s.name,
      agency: s.registeredAgency?.organizationName || null,
      course: s.selectedCourse?.title || null,
      university: s.selectedUniversity?.name || null,
      country: s.selectedUniversity?.country || null,
      chosenMentor: s.connectedMentor?.name || null,
      studentId: s._id,
    }));

    return res.status(200).json({
      message: "Success",
      total: rows.length,
      rows,
      query: q,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
