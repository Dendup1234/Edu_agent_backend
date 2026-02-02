import { Expo } from "expo-server-sdk";
import Student from "../models/student.js";
import Notification from "../models/notification.js";

const expo = new Expo();

export const sendStudentPushNotification = async ({
  studentId,
  triggerId,
  title,
  body,
}) => {
  if (!studentId || !title || !body) {
    throw new Error("studentId, title, body are required");
  }

  const student = await Student.findById(studentId)
    .select("expoPushToken registeredAgency")
    .lean();

  if (!student) throw new Error("Student not found");
  if (!student.expoPushToken) throw new Error("Student has no expoPushToken");

  if (!Expo.isExpoPushToken(student.expoPushToken)) {
    throw new Error("Invalid Expo push token");
  }

  // create DB history
  const notif = await Notification.create({
    receiverType: "Student",
    receiverId: studentId,
    triggeredByType: "Agency",
    triggeredById: triggerId || student.registeredAgency || null, // fallback
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

    if (
      !Array.isArray(ticketChunk) ||
      ticketChunk.length === 0 ||
      !ticketChunk[0]
    ) {
      await Notification.findByIdAndUpdate(notif._id, {
        status: "failed",
        error: "No valid ticket returned from Expo",
      });
      throw new Error("No valid ticket returned from Expo");
    }

    const ticket = ticketChunk[0];

    if (ticket.status === "error") {
      await Notification.findByIdAndUpdate(notif._id, {
        status: "failed",
        error: ticket.message || "Expo send error",
      });
      throw new Error(ticket.message || "Expo send error");
    }

    if (ticket.id) ticketId = ticket.id;
  }

  await Notification.findByIdAndUpdate(notif._id, {
    status: "sent",
    expoTicketId: ticketId,
  });

  return {
    notificationId: notif._id,
    expoTicketId: ticketId,
  };
};
