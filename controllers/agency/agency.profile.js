import Agency from "../../models/agency.js";
import University from "../../models/university.js";
import mongoose from "mongoose";
import Course from "../../models/course.js";

// Getting profile
export const getProfile = async (req, res) => {
  try {
    const user_id = req.user.sub;
    //Hides password and return plain json format
    const agency = await Agency.findById(user_id).select("-password").lean();
    if (!agency) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      profile: agency,
      tokenUser: { userId: user_id, email: req.user.email },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
//Updating a profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const update = req.body;
    // forbidden fields to be updated
    const forbidden = ["_id", "password"];
    forbidden.forEach((field) => delete update[field]);
    //Find by id and update
    const updatedAgency = await Agency.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    if (!updatedAgency) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Profile updated",
      profile: updatedAgency,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};
//Getting all the agency
export const getAllAgency = async (req, res) => {
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
};
// Getting agency by their id
export const getAgencybyId = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Invalid agency id" });
    }
    // Getting the agency by their particular id
    const agency = await Agency.findById(agencyId).select(
      "-password -googleId"
    ); // hide sensitive fields

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    return res.status(200).json({ message: "Successful", agency: agency });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

