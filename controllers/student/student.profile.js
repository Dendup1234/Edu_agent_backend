import Student from "../../models/student.js";
import Agency from "../../models/agency.js";
import Lead from "../../models/lead.js";

import mongoose from "mongoose";

// Getting profile of the student
export const getProfile = async (req, res) => {
  try {
    const user_id = req.user.sub;
    //Hides password and return plain json format
    const student = await Student.findById(user_id).select("-password").lean();
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      profile: student,
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
    const updatedStudent = await Student.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    if (!updatedStudent) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Profile updated",
      profile: updatedStudent,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

//When student selects particular agency
export const selectAgency = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { agencyId } = req.body;
    //Check agency id
    if (!agencyId) {
      return res.status(400).json({ message: "agencyId is required" });
    }
    // Validity of the agency id
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Enter the valid agency id" });
    }
    const agency = Agency.findById(agencyId);
    // check if the agency exist
    if (!agency) {
      res.status(404).json({ message: "No agency found" });
    }
    //Creating a new lead between the student and the agency
    const lead = await Lead.create({
      student: userId,
      agency: agencyId,
    });
    return res.status(200).json({
      message: "New lead successfully created",
      lead: lead,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};