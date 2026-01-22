import Mentor from "../../models/mentor.js";
// Getting all the mentor from the agency with mentees count
export const getAllMentor = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    //finding mentor connected to the specific mentor
    const mentors = await Mentor.find({ partnerAgency: userId });
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
// Getting the mentor by their ids (only confirmed mentees)
export const getMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const mentor = await Mentor.findById(mentorId).populate({
      path: "mentees.student",
      select: "name email phone profilePic selectedUniversity",
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Convert mongoose document to plain object
    const mentorObj = mentor.toObject();

    // Filter only confirmed mentees
    mentorObj.mentees = mentorObj.mentees.filter(
      (mentee) => mentee.status === "confirmed",
    );

    return res.status(200).json({
      message: "Success",
      mentor: mentorObj,
      confirmedMenteeCount: mentorObj.mentees.length,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deactivating the mentor
export const deactivateMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    // deactivating the mentor
    const mentor = await Mentor.findByIdAndUpdate(
      mentorId,
      {
        isActive: false,
      },
      { new: true, runValidators: true },
    );
    return res.status(200).json({ message: "Success", mentor: mentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
