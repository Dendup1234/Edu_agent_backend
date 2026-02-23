import { io } from "socket.io-client";

const SERVER_URL = "https://undeaf-crashing-ellie.ngrok-free.dev"; // change to your backend
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTljMjRjMmIyOTBhMjhjMTcxYzg3ZDQiLCJhY3RvciI6IlN0dWRlbnQiLCJpYXQiOjE3NzE4NDQ4NDd9.uH26y7VAj0BLjr0HXw6KuRJCMsuhn8CKTIQ1Waz9S4s"; // supply real token

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
  console.log(JSON.stringify(data, null, 2));
  loadMessages("")
//   sendMessage({
//   receiver: "698ed1b3ebacb64311c9cfd3",
//   receiverModel: "Mentor",
//   content: "is the auto message still overwriting your messages?",
//   conversationId: "6998b9d47dad286175dec128"
// });
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
