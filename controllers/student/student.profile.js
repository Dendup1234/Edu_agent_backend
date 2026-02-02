import Student from "../../models/student.js";
import Agency from "../../models/agency.js";
import { sendAutoMessage } from "../../client.js";
import mongoose from "mongoose";
import Notification from "../../models/notification.js";
import { sendStudentPushNotification } from "../../utils/notification.js";
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
// Select agency
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
      { new: true, runValidators: true },
    );

    // try {
    //   await sendAutoMessage(
    //     io,
    //     agencyId.toString(),
    //     "Agency",
    //     userId.toString(),
    //     "Student",
    //     `Welcome ${student.name}! We are excited to have you onboard.`
    //   );
    // } catch (e) {
    //   console.error("Auto message error:", e.message);
    // }

    return res.status(200).json({
      message: "Selection successful",
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
      { new: true },
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

// storing the push token in the student schema
export const updateStudentPushToken = async (req, res) => {
  try {
    const studentId = req.user?.sub; // adjust to your auth payload
    const { pushToken } = req.body;

    if (!studentId) return res.status(401).json({ message: "Invalid token" });
    if (!pushToken) {
      return res.status(400).json({ message: "pushToken is required" });
    }

    // Updating the student
    await Student.findByIdAndUpdate(
      studentId,
      { expoPushToken: pushToken },
      { new: true },
    );
    // Success message
    return res.status(200).json({ message: "Push token saved" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// getting the notification count if isRead is false
export const getMyNotificationCount = async (req, res) => {
  try {
    const studentId = req.user.sub;
    if (!studentId) return res.status(401).json({ message: "Invalid token" });
    const notificationCount = await Notification.countDocuments({
      receiverId: studentId,
      isRead: false,
    });
    return res.status(200).json({
      total: notificationCount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// getting the notification history
export const getMyNotificationHistory = async (req, res) => {
  try {
    const studentId = req.user.sub;
    if (!studentId) return res.status(401).json({ message: "Invalid token" });

    // updating all the notification as read as true
    await Notification.updateMany(
      { receiverId: studentId, isRead: false },
      { $set: { isRead: true } },
    );
    const notifications = await Notification.find({
      receiverId: studentId,
    })
      //createdAt as the notfication send time like 2 days ago or 1 days ago
      .select("title body status createdAt isRead")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      notifications,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// push notification test
export const sendStudentPush = async (req, res) => {
  try {
    const { studentId, triggerId, title, body } = req.body;

    const result = await sendStudentPushNotification({
      studentId,
      triggerId,
      title,
      body,
    });

    return res.status(200).json({
      message: "Push sent",
      ...result,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
