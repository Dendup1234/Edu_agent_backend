import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" } 
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Missing token");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.sub?.toString() || decoded.agencyId?.toString();
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
    console.log(`user connected ${userRoom}`)

    const conversations = await Conversation.find({
      "participants.user": socket.userId
    })
      .populate("participants.user")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name email" }
      })
      .sort({ updatedAt: -1 })
      .lean();

    socket.emit("conversation_list", conversations);

    socket.on("send_message", async (data) => {
      try {
        const { receiver, receiverModel, content } = data;

        if (!receiver || !content) return;

        const sender = socket.userId;
        const receiverId = receiver.toString();

        if (sender === receiverId) {
          return socket.emit("error", { message: "Cannot message yourself" });
        }

        const room = io.sockets.adapter.rooms.get(receiverId);
        const isReceiverOnline = !!room && room.size > 0;

        const participants = [
          { user: sender, model: socket.userModel },
          { user: receiverId, model: receiverModel }
        ];

        const participantsHash = [sender, receiverId].sort().join("_");

        let conversation = await Conversation.findOne({ participantsHash });

        if (!conversation) {
          try {
            conversation = await Conversation.create({
              participants,
              participantsHash
            });
          } catch (err) {
            conversation = await Conversation.findOne({ participantsHash });
          }
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          senderModel: socket.userModel,
          receiver: receiverId,
          receiverModel,
          content,
          status: isReceiverOnline ? "delivered" : "sent"
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        if (isReceiverOnline) {
          io.to(receiverId).emit("receive_message", message);
        }

        socket.emit("sent_message", message);

      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`user disconnected ${userRoom}`)
    });
  });

  return io;
};
