import { io } from "socket.io-client";

// Connect to your Socket.IO server
const socket = io("http://localhost:5000");

// Replace this with dynamic user ID in real use
const userId = "";  
const receiverId = ""; 
const conversationId = "";

// 1️⃣ Connection
socket.on("connect", () => {
  console.log("Connected to server with socket id:", socket.id);

  // Identify the user to server
  socket.emit("user_connected", userId);
});

// 2️⃣ Server confirms user connection
socket.on("connected", ({ socketId, userId }) => {
  console.log(`Server acknowledged connection: userId=${userId}, socketId=${socketId}`);

  // Optional: Join a conversation room
  socket.emit("join_conversation", conversationId);

  // 3️⃣ Send a test message to another user
  socket.emit("send_message", {
    conversationId,
    sender: userId,
    receiver: receiverId,
    content: "Hello from client!",
    senderModel: "User",
    receiverModel: "User"
  });
});

// 4️⃣ Listen for messages sent to you
socket.on("new_message", ({ message }) => {
  console.log("New message received:", message);
});

// 5️⃣ Listen for confirmation of sent message
socket.on("message_sent", ({ message, success }) => {
  console.log("Message sent confirmation:", message, "Success:", success);
});

// 6️⃣ Listen for delivery updates
socket.on("message_delivered", ({ messageId }) => {
  console.log(`Message ${messageId} delivered to receiver`);
});

// 7️⃣ Listen for read confirmations
socket.on("messages_read_confirmed", ({ messageIds, conversationId }) => {
  console.log(`Messages marked as read in conversation ${conversationId}:`, messageIds);
});

// 8️⃣ Error handling
socket.on("error", (errMsg) => {
  console.error("Socket error:", errMsg);
});

// 9️⃣ Disconnect
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
