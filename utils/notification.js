import { Expo } from "expo-server-sdk";
import Student from "../models/student.js";
import Notification from "../models/notification.js";

const expo = new Expo();

export const sendStudentPushNotification = async (req, res) => {
  try {
    const { studentId, triggerId, title, body } = req.body;

    if (!studentId || !title || !body) {
      return res.status(400).json({
        message: "studentId, title, body are required",
      });
    }

    const student = await Student.findById(studentId)
      .select("expoPushToken registeredAgency")
      .lean();

    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!student.expoPushToken)
      return res.status(400).json({ message: "Student has no expoPushToken" });

    if (!Expo.isExpoPushToken(student.expoPushToken)) {
      return res.status(400).json({ message: "Invalid Expo push token" });
    }

    // SAVE notif reference
    const notif = await Notification.create({
      receiverType: "Student",
      receiverId: studentId,
      triggeredByType: "Agency",
      triggeredById: triggerId,
      title,
      body,
      status: "queued",
    });

    const messages = [
      {
        to: student.expoPushToken,
        sound: "default",
        title,
        body,
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    let ticketId = null;

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

      // Guard 1
      if (!Array.isArray(ticketChunk) || ticketChunk.length === 0) {
        await Notification.findByIdAndUpdate(notif._id, {
          status: "failed",
          error: "No ticket returned from Expo",
        });
        return res.status(500).json({
          message: "Failed to send push",
          error: "No ticket returned from Expo",
        });
      }

      const ticket = ticketChunk[0];

      //Guard 2 (THIS FIXES YOUR ERROR)
      if (!ticket || typeof ticket !== "object") {
        await Notification.findByIdAndUpdate(notif._id, {
          status: "failed",
          error: "Invalid ticket returned from Expo",
        });
        return res.status(500).json({
          message: "Failed to send push",
          error: "Invalid ticket returned from Expo",
        });
      }

      // Guard 3
      if (ticket.status === "error") {
        await Notification.findByIdAndUpdate(notif._id, {
          status: "failed",
          error: ticket.message || "Expo send error",
        });
        return res.status(500).json({
          message: "Failed to send push",
          error: ticket.message,
        });
      }

      if (ticket.id) ticketId = ticket.id;
    }

    // mark sent
    await Notification.findByIdAndUpdate(notif._id, {
      status: "sent",
      expoTicketId: ticketId,
    });

    return res.status(200).json({
      message: "Push sent",
      notificationId: notif._id,
      expoTicketId: ticketId,
    });
  } catch (e) {
    console.error("Push error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
