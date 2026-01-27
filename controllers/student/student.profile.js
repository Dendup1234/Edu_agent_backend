import Student from "../../models/student.js";
import Agency from "../../models/agency.js";
import { sendAutoMessage } from "../../client.js";
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

// select agency
export const selectAgency = (io) => async (req, res) => {
  try {
    const userId = req.user.sub;
    const { agencyId } = req.body;

    if (!agencyId) {
      return res.status(400).json({ message: "agencyId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Enter the valid agency id" });
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({ message: "No agency found" });
    }

    const student = await Student.findByIdAndUpdate(
      userId,
      {
        registeredAgency: agencyId,
        joinDate: new Date(),
        $push: {
          statusHistory: {
            status_name: "new",
            status_date: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    try {
      await sendAutoMessage(
        io,
        agencyId.toString(),
        "Agency",
        userId.toString(),
        "Student",
        `Welcome ${student.name}! We are excited to have you onboard.`
      );
    } catch (e) {
      console.error("Auto message error:", e.message);
    }

    return res.status(200).json({
      message: "Selection successful",
      student,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deactivating a student
export const deactivateStudent = async (req, res) => {
  const userId = req.user.sub;
  if (!userId) {
    return res.status(401).json({ message: "Invalid token" });
  }
  try {
    const { studentId } = req.params;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { isValid: false },
      { new: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      message: "Student deactivated",
      student,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
