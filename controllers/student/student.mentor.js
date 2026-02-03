import Mentor from "../../models/mentor.js";
import Student from "../../models/student.js";
import { getStudentConfirmed } from "../mentor/mentor.profile.js";
// getting all the mentor from student page
export const getAllMentor = async (req, res) => {
  try {
    const { agencyId } = req.params;
    // finding all the mentor from student
    const mentor = await Mentor.find({
      partnerAgency: agencyId,
      isVerified: true,
      isActive: true,
    });
    return res.status(200).json({ message: "Success", mentors: mentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};
// Getting the mentor by their ids
export const getMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;
    // getting the mentor by their id
    const mentor = await Mentor.findById(mentorId);
    return res.status(200).json({ message: "Success", mentor: mentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Student connecting with the mentor
export const connectMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const userId = req.user.sub; // student id
    console.log(userId);

    // Add mentee only if this student isn't already in mentees array
    const mentor = await Mentor.findOneAndUpdate(
      { _id: mentorId, "mentees.student": { $ne: userId } },
      { $push: { mentees: { student: userId, status: "pending" } } },
      { new: true, runValidators: true },
    );
    // If mentor not found (or student already existed)
    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found or request already exists",
      });
    }
    // updating the student schema
    const student = await Student.findByIdAndUpdate(
      userId,
      {
        connectedMentor: {
          mentor: mentorId,
          status: "pending",
        },
      },
      { new: true },
    );

    return res.status(200).json({
      message: "Success",
      mentor,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
