// Install first: npm install socket.io-client readline
import { io } from "socket.io-client";

// ===== CONFIG =====
const SERVER_URL = "https://undeaf-crashing-ellie.ngrok-free.dev"; // replace with your server
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTg5YjkyZDUxM2EwNTlhYTNlNWFmMDgiLCJhY3RvciI6IlN0dWRlbnQiLCJpYXQiOjE3NzA2MzM1MTd9.KT78j77fE5rrpKBsIQdGLSE9gLN7OGPvltozjMbRtZ0"; // <-- paste token here

// ===== SETUP SOCKET =====
const socket = io(`${SERVER_URL}`, {
  auth: { token: TOKEN }
});

// Log all events
socket.on("connect", () => {
  console.log("Connected as socket id:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("conversation_list", (conversations) => {
  console.log("Conversations:", JSON.stringify(conversations, null, 2));
});

