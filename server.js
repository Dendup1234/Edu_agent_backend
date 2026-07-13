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
import healthRoute from "./routes/health.js";
import { initializeWebSocket } from "./controllers/socket.js";
import { seedSuperAdmin } from "./scripts/seedSuperAdmin.js";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import admin from "./models/admin.js";
import chatRoutes from "./routes/chat.js";
import { initCollection } from "./rag/vector.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Config must run before using environment variables
dotenv.config();

// activating the vector DB
initCollection();

const app = express();

// Safe Swagger file loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.join(__dirname, "docs", "openapi.yaml");

if (fs.existsSync(openApiPath)) {
  const swaggerDocument = YAML.load(openApiPath);

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );
} else {
  console.warn("Swagger file not found:", openApiPath);
}

app.use(helmet());
app.use(express.json());
app.use(cors());

app.use("/api/v1/agency", agencyRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/agent", agentRoute);
app.use("/api/v1/mentor", mentorRoute);
app.use(oAuthRoute);
app.use("/api/v1/openai", chatRoutes);

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

// Socket.IO and server.listen only outside Vercel
if (!process.env.VERCEL) {
  initializeWebSocket(server);
}

app.use(healthRoute);
app.use("/api/v1/students", studentRoute);

await connectDB();

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;