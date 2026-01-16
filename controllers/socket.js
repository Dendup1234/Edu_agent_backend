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

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { sender, receiver, content, senderModel, receiverModel, conversationId } = data;

        if (!sender || !receiver || !content) {
          socket.emit('error', { message: 'missing required field' });
          return;
        }

        let convId = conversationId;

        if (!convId) {
          // Create new conversation if it doesn't exist
          const conversation = await Conversation.create({
            participants: [
              { sender, senderModel },
              { receiver, receiverModel }
            ]
          });
          convId = conversation._id;
        } else {
          // Verify conversation exists
          const conversation = await Conversation.findById(convId);
          if (!conversation) {
            socket.emit('error', { message: 'Conversation not found' });
            return;
          }
        }

        // Create message
        const message = await Message.create({
          conversationId: convId, // Use convId, not conversationId
          senderModel,
          sender,
          receiverModel,
          receiver,
          content
        });

        // Emit back to sender
        socket.emit('sent_message', { message });

        // Emit to receiver(s)
        io.to(receiver).emit('receive_message', { message });

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
