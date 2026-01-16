import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8000";
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTZhMGM4OGRhOTMxZjI2YmFlNzZhZDciLCJlbWFpbCI6InByYWRlZXBwb2tocmVsMjAyMkBnbWFpbC5jb20iLCJhY3RvciI6InN0dWRlbnQiLCJpYXQiOjE3Njg1NTgwNjF9.0oMUyDtgMG2vo_fQZtMrYSXVlCv8nhEE2xrgAagof9Y";
const RECEIVER_ID = "696397cff72a315772c30f3f";
const RECEIVER_MODEL = "Student"; 

const socket = io(SOCKET_URL, {
  auth: { token: JWT }
});

/* ===== Connection ===== */
socket.on("connect", () => {
  console.log("✅ connected:", socket.id);
});

socket.on("connected", (data) => {
  console.log("🟢 server confirmed:", data);

  // Send a test message
  socket.emit("send_message", {
    receiver: RECEIVER_ID,
    receiverModel: RECEIVER_MODEL,
    content: "Hello from test client"
  });
});

socket.on("disconnect", () => {
  console.log("❌ disconnected");
});

/* ===== Messaging ===== */
socket.on("sent_message", ({ message }) => {
  console.log("📤 sent_message:", message);
});

socket.on("receive_message", ({ message }) => {
  console.log("📥 receive_message:", message);
});

/* ===== Errors ===== */
socket.on("error", (err) => {
  console.error("⚠️ socket error:", err);
});
