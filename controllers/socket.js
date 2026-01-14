import { Server } from "socket.io";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js"

// Initialize WebSocket server
export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  // Store connected users
  const connectedUsers = new Map(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins with their ID
    socket.on("user_connected", (userId) => {
      console.log(`User ${userId} connected with socket ${socket.id}`);
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // Send confirmation back to client
      socket.emit("connected", { 
        socketId: socket.id,
        userId: userId 
      });
    });

    // Send Message Handler
    socket.on("send_message", async (data) => {
      try {
        console.log("Sending message:", data);
        
        const { sender, receiver, content, senderModel, receiverModel, conversationId } = data;

        // Validate required fields
        if (!sender || !receiver || !content) {
          socket.emit("error", { message: "Missing required fields" });
          return;
        }

        let convId = conversationId;
        let conversation;

        // Find or create conversation if no conversationId provided
        if (!convId) {
          // Look for existing conversation between these participants
          conversation = await Conversation.findOne({
            participants: { $all: [sender, receiver] },
            models: [senderModel, receiverModel],
          });

          if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
              participants: [sender, receiver],
              models: [senderModel || "User", receiverModel || "User"],
              lastMessage: messageData._id,
              lastMessageAt: new Date()
            });
          }
          convId = conversation._id;
        } else {
          // Fetch existing conversation
          conversation = await Conversation.findById(convId);
          if (!conversation) {
            socket.emit("error", { message: "Conversation not found" });
            return;
          }
          
          // Update conversation's last message
          conversation.lastMessage = messageData._id;
          conversation.lastMessageAt = new Date();
          await conversation.save();
        }

        // Create and save message to database
        const newMessage = new Message({
          conversationId: convId,
          senderModel: senderModel || "User",
          sender,
          receiverModel: receiverModel || "User",
          receiver,
          content,
          status: "sent"
        });

        const savedMessage = await newMessage.save();

        // Populate message data (optional: populate sender/receiver details)
        const messageData = {
          _id: savedMessage._id,
          conversationId: savedMessage.conversationId,
          sender: savedMessage.sender,
          receiver: savedMessage.receiver,
          content: savedMessage.content,
          status: savedMessage.status,
          createdAt: savedMessage.createdAt,
          senderModel: savedMessage.senderModel,
          receiverModel: savedMessage.receiverModel
        };

        // Send confirmation to sender
        socket.emit("message_sent", {
          message: messageData,
          conversationId: convId,
          success: true
        });

        // Send to receiver if online
        const receiverSocketId = connectedUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message", {
            message: messageData,
            conversationId: convId
          });
          console.log(`Message delivered to online user: ${receiver}`);
          
          // Update status to delivered after a short delay
          setTimeout(async () => {
            await Message.findByIdAndUpdate(savedMessage._id, { status: "delivered" });
            
            // Notify sender that message was delivered
            socket.emit("message_delivered", { 
              messageId: savedMessage._id,
              conversationId: convId
            });
          }, 100);
        } else {
          console.log(`Receiver ${receiver} is offline, message saved to database`);
          
          // Also update conversation in database for offline users
          await Conversation.findByIdAndUpdate(convId, {
            lastMessage: messageData._id,
            lastMessageAt: new Date(),
            $inc: { unreadCount: 1 } // Optional: track unread messages
          });
        }

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message", error: error.message });
      }
    });

    // Mark message as read 
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageIds, conversationId, readerId } = data;
        
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
          socket.emit("error", { message: "No message IDs provided" });
          return;
        }

        // Update messages status to 'read'
        const result = await Message.updateMany(
          { 
            _id: { $in: messageIds },
            receiver: readerId // Ensure the reader is the actual receiver
          },
          { status: "read", readAt: new Date() }
        );

        // Get sender IDs to notify
        const messages = await Message.find({ _id: { $in: messageIds } });
        const senderIds = [...new Set(messages.map(msg => msg.sender))];

        // Notify senders that their messages were read
        senderIds.forEach(senderId => {
          const senderSocketId = connectedUsers.get(senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("messages_read", {
              messageIds,
              conversationId,
              readBy: readerId,
              readAt: new Date()
            });
          }
        });

        console.log(`Messages marked as read: ${result.modifiedCount} messages`);
        
        // Update conversation unread count (optional)
        await Conversation.findByIdAndUpdate(conversationId, {
          $inc: { unreadCount: -result.modifiedCount }
        });
        
        socket.emit("messages_read_confirmed", {
          messageIds,
          conversationId,
          modifiedCount: result.modifiedCount
        });

      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read", error: error.message });
      }
    });

    //Typing indicator
    socket.on("typing", (data) => {
      const { conversationId, userId, isTyping } = data;
      if (conversationId && userId) {
        // Broadcast to other users in the conversation
        socket.to(`conversation_${conversationId}`).emit("user_typing", {
          userId,
          isTyping,
          conversationId
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Remove from connected users
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} removed from connected users`);
      }
    });

  });

  return io;
};