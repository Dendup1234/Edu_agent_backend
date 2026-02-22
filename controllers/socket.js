import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import { sendStudentMessageuPushNotification } from "../utils/notification.js";
import { getSenderDisplayInfo } from "../utils/senderInfoMessage.js";
import { loadMessagesCursor } from "../utils/cursor.js";

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

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
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userRoom = socket.userId;
    socket.join(userRoom);

    try {
      const conversations = await Conversation.find({
        "participants.user": socket.userId
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "participants.user",
          select: "name profileUrl"
        })
        .populate("lastMessage")
        .lean();

      socket.emit("conversation_list", {
        success: true,
        conversations
      });
    } catch {
      socket.emit("conversation_list", {
        success: false,
        error: "Failed to load conversations"
      });
    }

    socket.on("get_conversation_messages", async (data) => {
      try {
        const {
          conversationId,
          cursorCreatedAt = null,
          cursorId = null,
          limit = 5
        } = data;

        if (!conversationId) {
          return socket.emit("conversation_messages", {
            success: false,
            error: "Conversation ID required"
          });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          "participants.user": socket.userId
        }).lean();

        if (!conversation) {
          return socket.emit("conversation_messages", {
            success: false,
            error: "Unauthorized"
          });
        }

        const result = await loadMessagesCursor(conversationId, {
          cursorCreatedAt,
          cursorId,
          limit,
          excludeDeletedFor: socket.userId
        });

        socket.emit("conversation_messages", {
          success: true,
          conversationId,
          messages: result.messages,
          nextCursor: result.nextCursor,
          hasNextPage: result.hasNextPage
        });

      } catch {
        socket.emit("conversation_messages", {
          success: false,
          error: "Failed to fetch messages"
        });
      }
    });

    socket.on("send_message", async (data) => {
      try {
        const { receiver, receiverModel, content } = data;

        if (!receiver || !content?.trim()) {
          return socket.emit("message_error", {
            error: "Receiver and content required"
          });
        }

        const sender = socket.userId;
        const receiverId = receiver.toString();

        if (sender === receiverId) {
          return socket.emit("message_error", {
            error: "Cannot message yourself"
          });
        }

        const participantsHash = [sender, receiverId].sort().join("_");

        let conversation = await Conversation.findOne({ participantsHash });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [
              { user: sender, model: socket.userModel },
              { user: receiverId, model: receiverModel }
            ],
            participantsHash
          });
        }

        const room = io.sockets.adapter.rooms.get(receiverId);
        const isReceiverOnline = !!room && room.size > 0;

        const senderInfo = await getSenderDisplayInfo(sender, socket.userModel);

        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          senderModel: socket.userModel,
          receiver: receiverId,
          receiverModel,
          content: content.trim(),
          status: isReceiverOnline ? "delivered" : "sent"
        });

        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        const messageObj = message.toObject();
        messageObj.senderInfo = senderInfo;

        if (isReceiverOnline) {
          io.to(receiverId).emit("new_message", {
            message: messageObj,
            conversationId: conversation._id
          });
        } else if (receiverModel === "Student") {
          await sendStudentMessageuPushNotification({
            studentId: receiverId,
            triggerId: sender,
            title: `New message from ${senderInfo.name}`,
            body: content.length > 60
              ? content.slice(0, 60) + "..."
              : content
          });
        }

        socket.emit("message_sent", {
          message: messageObj,
          conversationId: conversation._id
        });

        const updatedConversation = await Conversation.findById(conversation._id)
          .populate("lastMessage")
          .lean();

        io.to(receiverId).emit("conversation_updated", updatedConversation);
        socket.emit("conversation_updated", updatedConversation);

      } catch {
        socket.emit("message_error", {
          error: "Failed to send message"
        });
      }
    });

    socket.on("edit_message", async ({ messageId, newContent }) => {
      try {
        if (!newContent?.trim()) {
          return socket.emit("error", { message: "Content required" });
        }

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId
        });

        if (!message) {
          return socket.emit("error", { message: "Unauthorized" });
        }

        message.content = newContent.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        const messageObj = message.toObject();
        const receiverRoom = message.receiver.toString();

        io.to(receiverRoom).emit("message_edited", messageObj);
        socket.emit("message_edited", messageObj);

        const updatedConversation = await Conversation.findById(
          message.conversationId
        )
          .populate("lastMessage")
          .lean();

        io.to(receiverRoom).emit("conversation_updated", updatedConversation);
        socket.emit("conversation_updated", updatedConversation);

      } catch {}
    });

    socket.on("delete_message", async ({ messageId, deleteFor }) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId
        });

        if (!message) {
          return socket.emit("error", { message: "Unauthorized" });
        }

        if (deleteFor === "everyone") {
          message.isDeleted = true;
          message.deletedAt = new Date();
          await message.save();

          const receiverRoom = message.receiver.toString();

          io.to(receiverRoom).emit("message_deleted", {
            messageId,
            conversationId: message.conversationId
          });

          socket.emit("message_deleted", {
            messageId,
            conversationId: message.conversationId
          });

          const updatedConversation = await Conversation.findById(
            message.conversationId
          )
            .populate("lastMessage")
            .lean();

          io.to(receiverRoom).emit("conversation_updated", updatedConversation);
          socket.emit("conversation_updated", updatedConversation);

        } else {
          await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: socket.userId }
          });

          socket.emit("message_deleted", { messageId });
        }

      } catch {}
    });

    socket.on("typing_start", ({ receiverId, conversationId }) => {
      io.to(receiverId).emit("user_typing", {
        conversationId,
        userId: socket.userId,
        userModel: socket.userModel
      });
    });

    socket.on("typing_stop", ({ receiverId, conversationId }) => {
      io.to(receiverId).emit("user_stopped_typing", {
        conversationId,
        userId: socket.userId
      });
    });
  });

  return io;
};