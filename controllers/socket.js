import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

const onlineUsers = new Map();

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub || decoded.agencyId;
      socket.userModel = decoded.actor;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join(userId.toString());

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    socket.data.userId = userId;

    socket.emit("connected", { userId });

    socket.on("send_message", async ({ receiver, receiverModel, content }) => {
      try {
        if (!receiver || !receiverModel || !content) {
          return socket.emit("error", { message: "Missing fields" });
        }

        const sender = socket.userId;
        const senderModel = socket.userModel;

        let conversation = await Conversation.findOne({participants: {}});

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [
              { user: sender, model: senderModel },
              { user: receiver, model: receiverModel }
            ]
          });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          senderModel,
          receiver,
          receiverModel,
          content,
          status: onlineUsers.has(receiver.toString()) ? "delivered" : "sent"
        });

        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessage: message._id
        });

        socket.emit("sent_message", { message });
        io.to(receiver.toString()).emit("receive_message", { message });

      } catch (err) {
        console.error(err);
        socket.emit("error", { message: "Internal error" });
      }
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);
      if (sockets.size === 0) onlineUsers.delete(userId);
    });
  });

  return io;
};
