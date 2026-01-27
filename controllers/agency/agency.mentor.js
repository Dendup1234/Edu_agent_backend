import Mentor from "../../models/mentor.js";
// Getting all the mentor from the agency with mentees count
export const getAllMentor = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    //finding mentor connected to the specific mentors
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
// Dashboard to show the mentor active and inactive count
export const getMentorDashboard = async (req, res) => {
  try {
    const userId = req.user.agencyId;

    // finding the count of the isActive true
    const activeMentor = await Mentor.find({
      isActive: true,
      partnerAgency: userId,
    });
    const activeMentorCount = activeMentor.length;

    // finding the count of the isActive false
    const InActiveMentor = await Mentor.find({
      isActive: false,
      partnerAgency: userId,
    });
    const InActiveMentorCount = InActiveMentor.length;
    return res.status(200).json({
      message: "Success",
      activeMentorCount: activeMentorCount,
      InActiveMentorCount: InActiveMentorCount,
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

//Searching mentor api
export const searchMentorByName = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Name is required for search" });
    }

    const mentors = await Mentor.find({
      partnerAgency: agencyId,
      name: { $regex: name, $options: "i" },
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
