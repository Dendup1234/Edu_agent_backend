import Mentor from "../../models/mentor.js";

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
