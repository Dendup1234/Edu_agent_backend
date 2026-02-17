import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import { sendStudentMessageuPushNotification } from "../utils/notification.js";
import { getSenderDisplayInfo } from "../utils/senderInfoMessage.js";
import { loadMessagesCursor } from "../utils/cursor.js";
import mongoose from "mongoose";

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Missing token");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.actor === "Agent" || decoded.actor === "Mentor") {
        socket.userId = decoded.id.toString();
      } else if (decoded.actor === "Agency") {
        socket.userId = decoded.agencyId.toString();
      } else {
        socket.userId = decoded.sub?.toString();
      }

      socket.userModel = decoded.actor;

      if (!socket.userId || !socket.userModel) {
        throw new Error("Invalid token payload");
      }

      next();
    } catch (error) {
      console.error("Auth error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userRoom = socket.userId;
    socket.join(userRoom);
    console.log(`User connected: ${socket.userModel} - ${userRoom}`);

    // Send full conversation list with last message details
    try {
      const conversations = await Conversation.find({
        "participants.user": socket.userId,
    })
      .sort({ updatedAt: -1 })
      .populate({
        path: "lastMessage",
        select: "content sender senderModel createdAt status",
      })
      .lean();

    socket.emit("conversation_list", {
      success: true,
      conversations,
    });
    } catch (error) {
      console.error("Error loading conversations:", error);
      socket.emit("conversation_list", {
        success: false,
        error: "Failed to load conversations",
      });
    }

    // Handle fetching messages for a specific conversation
    socket.on("get_conversation_messages", async (data) => {
      try {
        const { conversationId, cursorCreatedAt = null, cursorId = null, limit = 5 } = data;

        if (!conversationId) {
          return socket.emit("conversation_messages", {
            success: false,
            error: "Conversation ID required",
          });
        }

        // Verify user is a participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          "participants.user": socket.userId,
        }).lean();

        if (!conversation) {
          return socket.emit("conversation_messages", {
            success: false,
            error: "Conversation not found or unauthorized",
          });
        }

        // Use cursor-based pagination
        const result = await loadMessagesCursor(conversationId, {
          cursorCreatedAt,
          cursorId,
          limit,
        });

        socket.emit("conversation_messages", {
          success: true,
          conversationId,
          messages: result.messages,
          nextCursor: result.nextCursor,
          hasNextPage: result.hasNextPage,
        });
      } catch (error) {
        console.error("get_conversation_messages error:", error);
        socket.emit("conversation_messages", {
          success: false,
          error: "Failed to fetch messages",
        });
      }
    });

    // Send message handler
    socket.on("send_message", async (data) => {
      try {
        const { receiver, receiverModel, content, conversationId } = data;

        // Validation
        if (!receiver || !content?.trim()) {
          return socket.emit("message_error", {
            error: "Receiver and content are required",
          });
        }

        const sender = socket.userId;
        const receiverId = receiver.toString();

        if (sender === receiverId) {
          return socket.emit("message_error", {
            error: "Cannot message yourself",
          });
        }

        // Check if receiver is online
        const room = io.sockets.adapter.rooms.get(receiverId);
        const isReceiverOnline = !!room && room.size > 0;

        // Find or create conversation
        const participants = [
          { user: sender, model: socket.userModel },
          { user: receiverId, model: receiverModel },
        ];

        const participantsHash = [sender, receiverId].sort().join("_");

        let conversation = await Conversation.findOne({ participantsHash });

        if (!conversation) {
          try {
            conversation = await Conversation.create({
              participants,
              participantsHash,
            });
          } catch (err) {
            // Handle race condition
            conversation = await Conversation.findOne({ participantsHash });
            if (!conversation) {
              throw new Error("Failed to create conversation");
            }
          }
        }

        // Get sender info for notifications
        const senderInfo = await getSenderDisplayInfo(sender, socket.userModel);

        // Create message
        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          senderModel: socket.userModel,
          receiver: receiverId,
          receiverModel,
          content: content.trim(),
          status: isReceiverOnline ? "delivered" : "sent",
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Prepare message object
        const messageObj = message.toObject();
        messageObj.senderInfo = senderInfo;

        // Send to receiver if online
        if (isReceiverOnline) {
          io.to(receiverId).emit("new_message", {
            message: messageObj,
            conversationId: conversation._id,
          });

          // Update receiver's conversation list
          const updatedConversation = await Conversation.findById(
            conversation._id
          )
            .populate("lastMessage")
            .lean();
          io.to(receiverId).emit("conversation_updated", updatedConversation);
        } else {
          // Send push notification if offline and receiver is student
          if (receiverModel === "Student") {
            try {
              await sendStudentMessageuPushNotification({
                studentId: receiverId,
                triggerId: sender,
                title: `New message from ${senderInfo.name} (${senderInfo.model})`,
                body:
                  content.length > 60
                    ? content.slice(0, 60) + "..."
                    : content,
              });
            } catch (e) {
              console.error("Push notification failed:", e.message);
            }
          }
        }

        // Confirm to sender
        socket.emit("message_sent", {
          message: messageObj,
          conversationId: conversation._id,
        });

        // Update sender's conversation list
        const updatedConversation = await Conversation.findById(conversation._id)
          .populate("lastMessage")
          .lean();
        socket.emit("conversation_updated", updatedConversation);
      } catch (error) {
        console.error("send_message error:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
          details: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userRoom}`);
    });
  });

  return io;
};