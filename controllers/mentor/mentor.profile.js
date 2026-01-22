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
