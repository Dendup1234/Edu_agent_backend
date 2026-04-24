import Agent from "../models/agent.js";
import Role from "../models/role.js";
import { generatePassword } from "../utils/password.js";
import {
  sendAccountEmail,
  sendAgentAssignmentEmail,
} from "../utils/sendEmail.js";
import Mentor from "../models/mentor.js";
import bcrypt from "bcryptjs";
import Student from "../models/student.js";
import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import { getSenderDisplayInfo } from "../utils/senderInfoMessage.js";
import { sendStudentMessageuPushNotification } from "../utils/notification.js";

export async function createAutoMessage(agentId, studentId, agentName) {
  try {
    const participants = [
      { user: agentId, model: "Agent" },
      { user: studentId, model: "Student" },
    ];

    const participantsHash = [agentId.toString(), studentId.toString()]
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
    const welcomeContent = `Hello, I'm ${agentName}, your assigned agent. I'm here to guide you through your application process. If you have any queries or need assistance, feel free to reach out anytime. Looking forward to working with you!`;

    const message = await Message.create({
      conversationId: conversation._id,
      sender: agentId,
      senderModel: "Agent",
      receiver: studentId,
      receiverModel: "Student",
      content: welcomeContent,
      status: "sent",
    });

    // Update conversation with last message
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    console.log(
      `Welcome message sent to student ${studentId} from agent ${agentId}`,
    );
    // sending the message notification to the student
    await sendStudentMessageuPushNotification({
      studentId: studentId,
      triggerId: agentId,
      title: `New message from ${agentName}`,
      body:
        message.content.length > 60
          ? message.content.slice(0, 60) + "..."
          : message.content,
    });
  } catch (error) {
    console.error("Error creating welcome message:", error);
    // Don't throw - we don't want to break agent assignment if messaging fails
  }
}
