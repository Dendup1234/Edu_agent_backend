import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub || decoded.agencyId;
      socket.userModel = decoded.actor;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
      
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(socket.userId);
    socket.emit('connected');

    socket.on('send_message', async (data) => {
      try {
        const { receiver, content, receiverModel } = data;
        const sender = socket.userId;
        const senderModel = socket.userModel;

        const isReceiverOnline = io.sockets.adapter.rooms.has(receiver);

        const participants = [
          { user: sender, model: senderModel },
          { user: receiver, model: receiverModel }
        ].sort((a, b) => a.user.toString().localeCompare(b.user.toString()));

        let conversation = await Conversation.findOne({
          'participants.user': { $all: [sender, receiver] },
          'participants': { $size: 2 }
        });
        
        if (!conversation) {
          conversation = await Conversation.create({ participants });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          senderModel,
          receiver,
          receiverModel,
          content,
          status: isReceiverOnline ? 'delivered' : 'sent'
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        if (isReceiverOnline) {
          io.to(receiver).emit('receive_message', { message });
        }

        socket.emit('sent_message', { message });

      } catch (error) {
        console.error(error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};