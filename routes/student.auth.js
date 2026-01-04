import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  sendOtp,
  resendOtp,
  verifyOtp,
  login,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  setNewPassword,
} from "../controllers/student.auth.js";
import Student from "../models/student.js";
import Agency from "../models/agency.js";
import mongoose from "mongoose";
const router = express.Router();

//For authentication
router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//Crud functionality in the profile
//Specific user
router.get("/profile", protect, async (req, res) => {
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
});

//Update
router.patch("/profile", protect, async (req, res) => {
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
});

// When student select a particular agency
router.post("/select-agency", protect, async (req, res) => {
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
    // Updating the agency to the student
    const updatedStudent = await Student.findByIdAndUpdate(userId, {
      selectedAgency: agencyId,
    }).populate("selectedAgency", "name");
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student does not exist" });
    }
    return res.status(200).json({
      message: "Agency successfully selected",
      student: {
        id: updatedStudent._id,
        name: updatedStudent.name,
        agency: updatedStudent.selectedAgency,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
