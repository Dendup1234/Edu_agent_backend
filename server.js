import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import helmet from "helmet";
import studentRoute from "./routes/student.js";
import agencyRoute from "./routes/agency.js";
import oAuthRoute from "./routes/oAuth.js";
import adminRoute from "./routes/admin.js";
import agentRoute from "./routes/agent.js";
import mentorRoute from "./routes/mentor.js";
import { initializeWebSocket } from "./controllers/socket.js";
import { seedSuperAdmin } from "./scripts/seedSuperAdmin.js";
import rateLimit from "express-rate-limit";

// Config
dotenv.config();

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
// Express app command
const app = express();

// rate limiting
app.use(limiter);
//helmet config
app.use(helmet());

app.use(express.json());
app.use(cors());

// REST routes git push
app.use("/api/v1/agency", agencyRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/agent", agentRoute);
app.use("/api/v1/mentor", mentorRoute);
app.use(oAuthRoute);

// Server setup
const PORT = process.env.PORT || 8000;

// Create HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeWebSocket(server);

// Connect to database
await connectDB();
// seed the super admin after the db connect
//await seedSuperAdmin();

app.use("/api/v1/students", studentRoute(io));

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
