import Mentor from "../../models/mentor.js";

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
