import { Server } from "socket.io";
import Message from "../models/message.js";

// Initialize WebSocket server
export const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // Your frontend URL
      methods: ["GET", "POST"]
    }
  });

  // Store connected users (simple in-memory storage)
  const connectedUsers = new Map(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. User joins with their ID
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

    // 2. Send Message Handler (CORE FEATURE)
    socket.on("send_message", async (data) => {
      try {
        console.log("Sending message:", data);
        
        const { conversationId, sender, receiver, content, senderModel, receiverModel } = data;

        // Validate required fields
        if ( !sender || !receiver || !content) {
          socket.emit("error", "Missing required fields");
          return;
        }

        if (!conversationId) {
          let conversation = await Conversation.findOne({
            participants: { $all: [sender, receiver] },
            models: [senderModel || "User", receiverModel || "User"],
          });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [sender, receiver],
            models: [senderModel || "User", receiverModel || "User"],
          });
        }

        conversationId = conversation._id;
      }

        // Create and save message to database
        const newMessage = new Message({
          conversationId,
          senderModel: senderModel || "User",
          sender,
          receiverModel: receiverModel || "User",
          receiver,
          content,
          status: "sent"
        });

        const savedMessage = await newMessage.save();

        // Prepare message data to send
        const messageData = {
          _id: savedMessage._id,
          conversationId: savedMessage.conversationId,
          sender: savedMessage.sender,
          receiver: savedMessage.receiver,
          content: savedMessage.content,
          status: savedMessage.status,
          createdAt: savedMessage.createdAt
        };

        // Send to sender (confirmation)
        socket.emit("message_sent", {
          message: messageData,
          success: true
        });

        // Send to receiver if online
        const receiverSocketId = connectedUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message", {
            message: messageData,
            conversationId: conversationId
          });
          console.log(`Message delivered to online user: ${receiver}`);
          
          // Update status to delivered
          setTimeout(async () => {
            await Message.findByIdAndUpdate(savedMessage._id, { status: "delivered" });
            
            // Notify sender that message was delivered
            socket.emit("message_delivered", { 
              messageId: savedMessage._id 
            });
          }, 100);
        } else {
          console.log(`Receiver ${receiver} is offline, message saved to database`);
        }

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", "Failed to send message");
      }
    });

    // 3. Mark message as read
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageIds, conversationId } = data;
        
        // Update messages status to 'read'
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { status: "read" }
        );

        // Notify sender that messages were read
        // You might want to get the sender from the messages
        // For simplicity, we'll just update in database
        
        console.log(`Messages marked as read: ${messageIds.length} messages`);
        
        socket.emit("messages_read_confirmed", {
          messageIds,
          conversationId
        });

      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // 4. Join a conversation room
    socket.on("join_conversation", (conversationId) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
      }
    });

    // 5. Leave a conversation room
    socket.on("leave_conversation", (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
      }
    });

    // 6. Handle disconnection
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