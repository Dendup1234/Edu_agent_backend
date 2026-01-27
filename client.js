import Message from "./models/message.js";
import Conversation from "./models/application.js";

export const sendAutoMessage = async (io, senderId, senderModel, receiverId, receiverModel, content) => {
  if (!receiverId || !content) return;

  if (senderId === receiverId) {
    throw new Error("Cannot send message to yourself");
  }

  // Check if receiver is online
  const room = io.sockets.adapter.rooms.get(receiverId);
  const isReceiverOnline = !!room && room.size > 0;

  const participants = [
    { user: senderId, model: senderModel },
    { user: receiverId, model: receiverModel }
  ];

  const participantsHash = [senderId, receiverId].sort().join("_");

  // Find or create conversation
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

  // Create the message
  const message = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    senderModel,
    receiver: receiverId,
    receiverModel,
    content,
    status: isReceiverOnline ? "delivered" : "sent"
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  // Emit message if receiver online
  if (isReceiverOnline) {
    io.to(receiverId).emit("receive_message", message);
  }

  return message; 
};
