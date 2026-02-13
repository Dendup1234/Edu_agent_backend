import { io } from "socket.io-client";

const SERVER_URL = "https://undeaf-crashing-ellie.ngrok-free.dev"; // change to your backend
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OThmNTZlNDQ1YWM1NmIyMDEzMzY4OGUiLCJlbWFpbCI6ImRhbWNoZXlub3JidTc3MzlAZ21haWwuY29tIiwiYWN0b3IiOiJTdHVkZW50IiwiaWF0IjoxNzcxMDAxNTcyfQ.6eUX7jc9gPFV2FGZW2DlkONYh04GW1aCGyLD6xu-obM"; // supply real token

// Connect
const socket = io(SERVER_URL, {
  auth: {
    token: TOKEN
  },
  transports: ["websocket"]
});

// -------------------
// Connection Events
// -------------------

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

// socket.on("disconnect", () => {
//   console.log("Disconnected");
// });

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});

// -------------------
// Conversation List
// -------------------

socket.on("conversation_list", (data) => {
  console.log("Conversations:", data);
  loadMessages("698f5cdfacb6969cec47ca59")
});

// -------------------
// Fetch Messages
// -------------------

export function loadMessages(conversationId, cursor = null) {
  socket.emit("get_conversation_messages", {
    conversationId,
    cursorCreatedAt: cursor?.createdAt,
    cursorId: cursor?._id,
    limit: 5
  });
}

socket.on("conversation_messages", (data) => {
  console.log("Messages:", data);
});

// -------------------
// Send Message
// -------------------

export function sendMessage({
  receiver,
  receiverModel,
  content,
  conversationId
}) {
  socket.emit("send_message", {
    receiver,
    receiverModel,
    content,
    conversationId
  });
}

socket.on("message_sent", (data) => {
  console.log("Message sent:", data);
});

socket.on("message_error", (err) => {
  console.error("Send failed:", err);
});

// -------------------
// Incoming Messages
// -------------------

socket.on("new_message", (data) => {
  console.log("New message:", data);
});

// -------------------
// Conversation Update
// -------------------

socket.on("conversation_updated", (conv) => {
  console.log("Conversation updated:", conv);
});

// -------------------
// Read / Delivered
// -------------------

socket.on("messages_read", (data) => {
  console.log("Read receipt:", data);
});

socket.on("messages_delivered", (data) => {
  console.log("Delivered receipt:", data);
});

export function markDelivered(conversationId) {
  socket.emit("mark_delivered", { conversationId });
}

// -------------------
// Typing Indicators
// -------------------

export function typingStart(conversationId, receiverId) {
  socket.emit("typing_start", { conversationId, receiverId });
}

export function typingStop(conversationId, receiverId) {
  socket.emit("typing_stop", { conversationId, receiverId });
}

socket.on("user_typing", (data) => {
  console.log("Typing:", data);
});

socket.on("user_stopped_typing", (data) => {
  console.log("Stopped typing:", data);
});
