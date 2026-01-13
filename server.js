//Imports
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import studentRoute from "./routes/student.js";
import agencyRoute from "./routes/agency.js";
import oAuthRoute from "./routes/oAuth.js";
import adminRoute from "./routes/admin.js";
import agentRoute from "./routes/agent.js";
import cors from "cors";

//config
dotenv.config();

// app config
const app = express();
app.use(express.json());
app.use(cors());

//routes
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/agency", agencyRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/agent", agentRoute);
app.use(oAuthRoute);

// Listening to the port 8000
const PORT = process.env.PORT || 8000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
