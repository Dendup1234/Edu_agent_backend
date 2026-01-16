import { Server } from "socket.io";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on('connection', (socket) => {
    console.log(`user connected ${socket.id}`);

    // Join user-specific room
    socket.on('user_connected', (userId) => {
      socket.join(userId);
      console.log(`socket ${socket.id} joined room ${userId}`);
      socket.emit('connected', { userId });
    });

    socket.on('send_message', async (data) => {
    try {
      const { sender, receiver, content, senderModel, receiverModel } = data;

      if (!sender || !receiver || !content || !senderModel || !receiverModel) {
        socket.emit('error', { message: 'missing required field' });
        return;
      }

      // normalize participants
      const participants = [
        { user: sender, model: senderModel },
        { user: receiver, model: receiverModel }
      ].sort((a, b) =>
        a.user.toString().localeCompare(b.user.toString())
      );

      // find or create conversation
      let conversation = await Conversation.findOne({
        participants: {
          $all: [
            { $elemMatch: participants[0] },
            { $elemMatch: participants[1] }
          ]
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({ participants });
      }

      // create message
      const message = await Message.create({
        conversationId: conversation._id,
        sender,
        senderModel,
        receiver,
        receiverModel,
        content
      });

      // update conversation metadata
      await Conversation.findByIdAndUpdate(
        conversation._id,
        { lastMessage: message._id }
      );

      // emit
      socket.emit('sent_message', { message });
      io.to(receiver.toString()).emit('receive_message', { message });

      // update message status
      await Message.findByIdAndUpdate(message._id, { status: "delivered" });

    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'something went wrong' });
    }
  });

  socket.on('disconnect', () => {
      console.log(`socket ${socket.id} removed from all rooms automatically`);
    });
  });

  return io;
};
