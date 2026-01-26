import {io} from "socket.io-client"

const socket = io("https://undeaf-crashing-ellie.ngrok-free.dev", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VuY3lJZCI6IjY5NjVmMDhiMjhkNGQwZDM2NzY5ODgyNyIsImFjdG9yIjoiQWdlbmN5IiwiaWF0IjoxNzY5NDA0OTUxfQ.m6WMmCmmtWVymTVXNCGJ4aNoTNgkmH8EMYRMEiv07oY"
  }
});

// Connection events
socket.on("connect", () => {
  console.log("Connected to server");
  console.log("Socket ID:", socket.id);
});

// Receive conversation list
socket.on("conversation_list", (conversations) => {
  console.log("Conversations:", conversations);
});

// Receive new message
socket.on("receive_message", (message) => {
  console.log("New message received:", message);
});

// Confirmation that message was sent
socket.on("sent_message", (message) => {
  console.log("Message sent successfully:", message);
});

// Send a message
socket.emit("send_message", {
    receiver: "",
    receiverModel: "Student",
    content: "hello pradeep part 2"
  });

