import { Server } from "socket.io";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

const onlineUsers = new Map()

export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on('connection', (socket) => {
    console.log(`user connected ${socket.id}`);

    socket.on('user_connected', (userId) => {
      socket.join(userId);
      console.log(`socket ${socket.id} joined room ${userId}`);
      
      if(!onlineUsers.has(userId)){
        onlineUsers.set(userId, new Set())
      }

      onlineUsers.get(userId).add(socket.id)
      socket.data.userId = userId

      socket.emit('connected', { userId });
    });

    socket.on('send_message', async (data) => {
    try {
      const { sender, receiver, content, senderModel, receiverModel } = data;

      if (!sender || !receiver || !content || !senderModel || !receiverModel) {
        socket.emit('error', { message: 'missing required field' });
        return;
      }

      const senderExists = await mongoose.model(senderModel).exists({ _id: sender });
      const receiverExists = await mongoose.model(receiverModel).exists({ _id: receiver });

      if (!senderExists || !receiverExists) {
        return socket.emit("error", { message: "Invalid sender or receiver ID" });
      }

      const participants = [
        { user: sender, model: senderModel },
        { user: receiver, model: receiverModel }
      ].sort((a, b) => a.user.toString().localeCompare(b.user.toString()));

      let conversation = await Conversation.findOne(participants);

      if (!conversation) {
        conversation = await Conversation.create({ participants });
      }

      const message = await Message.create({
        conversationId: conversation._id,
        sender,
        senderModel,
        receiver,
        receiverModel,
        content
      });

      await Conversation.findByIdAndUpdate(
        conversation._id,
        { lastMessage: message._id }
      );

      socket.emit('sent_message', { message });
      io.to(receiver.toString()).emit('receive_message', { message })

      const isReceiverOnline = onlineUsers.has(receiver.toString())
      if(isReceiverOnline){
         await Message.findByIdAndUpdate(message._id, { status: "delivered" });
      }
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'something went wrong' });
    }
  });

  socket.on('disconnect', () => {
      const userId = socket.data.userId
      if(!userId) return

      const sockets = onlineUsers.get(userId);

      if(sockets) { 
      sockets.delete(socket.id);

      if(sockets.size === 0){
        onlineUsers.delete(userId);
      }}
      console.log(`socket ${socket.id} removed from all rooms automatically`);
    });
  });

  return io;
};
