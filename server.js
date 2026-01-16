import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import studentRoute from "./routes/student.js";
import agencyRoute from "./routes/agency.js";
import oAuthRoute from "./routes/oAuth.js";
import adminRoute from "./routes/admin.js";
import agentRoute from "./routes/agent.js";

import {initializeWebSocket} from "./controllers/socket.js";

// Config
dotenv.config();

// Express app
const app = express();
app.use(express.json());
app.use(cors());

// REST routes
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/agency", agencyRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/agent", agentRoute);
app.use(oAuthRoute);

// Server setup
const PORT = process.env.PORT || 8000;

// Create HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeWebSocket(server);

// Connect to database
await connectDB();

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
