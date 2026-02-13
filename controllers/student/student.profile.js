import Student from "../../models/student.js";
import Agency from "../../models/agency.js";
import mongoose from "mongoose";
import Message from "../../models/message.js";
import Conversation from "../../models/conversation.js";
import Notification from "../../models/notification.js";
import { sendStudentPushNotification } from "../../utils/notification.js";
import { loadNotificationsCursor } from "../../utils/cursor.js";

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

// Helper function to create welcome message
async function createAutoMessage(agencyId, studentId, organizationName) {
  try {
    const participants = [
      { user: agencyId, model: "Agency" },
      { user: studentId, model: "Student" },
    ];

    const participantsHash = [agencyId.toString(), studentId.toString()]
      .sort()
      .join("_");

    // Check if conversation already exists
    let conversation = await Conversation.findOne({ participantsHash });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants,
        participantsHash,
      });
    }

    // Create welcome message
    const welcomeContent = `Welcome! We're excited to have you join ${agencyName}. Feel free to reach out if you have any questions or need assistance. We're here to help you succeed!`;

    const message = await Message.create({
      conversationId: conversation._id,
      sender: agencyId,
      senderModel: "Agency",
      receiver: studentId,
      receiverModel: "Student",
      content: welcomeContent,
      status: "sent",
    });

    // Update conversation with last message
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    console.log(`Welcome message sent to student ${studentId} from agency ${agencyId}`);
  } catch (error) {
    console.error("Error creating welcome message:", error);
    // Don't throw - we don't want to break student registration if messaging fails
  }
}

// Select agency
export const selectAgency = async (req, res) => {
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

    // Create welcome message conversation
    await createAutoMessage(agencyId, userId, agency.organizationName);

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
export const getMyNotifications = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const studentActor = req.user.actor;

    const { cursorCreatedAt = null, cursorId = null, limit = 10 } = req.query;

    const data = await loadNotificationsCursor(studentId, studentActor, {
      cursorCreatedAt,
      cursorId,
      limit,
    });

    // mark ONLY fetched notifications as read
    const ids = data.notifications.map((n) => n._id);

    await Notification.updateMany(
      { _id: { $in: ids }, isRead: false },
      { $set: { isRead: true } },
    );

    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Server error" });
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
