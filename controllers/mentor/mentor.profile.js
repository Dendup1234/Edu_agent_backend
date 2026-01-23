import Mentor from "../../models/mentor.js";

// Getting the profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    // getting the mentor profile
    const mentor = await Mentor.findById(userId);

    //Success message
    return res.status(200).json({ message: "Success", mentor: mentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Updating the profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    const update = req.body;
    // updating the profile of the mentor
    const updatedMentor = await Mentor.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password");
    return res.status(200).json({ message: "Success", mentor: updatedMentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
// Getting the student pending status
export const getStudentPending = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    const mentor = await Mentor.findById(userId).populate({
      path: "mentees.student",
      select: "name email phone profileUrl selectedUniversity selectedCourse",
      populate: [
        { path: "selectedUniversity", select: "name country logo websiteURL" },
        { path: "selectedCourse", select: "title level duration intake fee" },
      ],
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    // Only the pending  mentees are shown
    const confirmedMentees = mentor.mentees.filter(
      (m) => m.status === "pending" && m.student,
    );

    return res.status(200).json({
      message: "Success",
      mentorId: mentor._id,
      confirmedCount: confirmedMentees.length,
      mentees: confirmedMentees,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Fetching the student from the mentor with course and university selected when he/she is confirmed in mentor connection
export const getStudentConfirmed = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    const mentor = await Mentor.findById(userId).populate({
      path: "mentees.student",
      select: "name email phone profileUrl selectedUniversity selectedCourse",
      populate: [
        { path: "selectedUniversity", select: "name country logo websiteURL" },
        { path: "selectedCourse", select: "title level duration intake fee" },
      ],
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    // Only the confirmed mentees are shown
    const confirmedMentees = mentor.mentees.filter(
      (m) => m.status === "confirmed" && m.student,
    );

    return res.status(200).json({
      message: "Success",
      mentorId: mentor._id,
      confirmedCount: confirmedMentees.length,
      mentees: confirmedMentees,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
