//Imports
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'
import userRoute from "./routes/user.auth.route.js";
import oAuthRoute from "./routes/oAuth.js";
import cors from 'cors';

//config
dotenv.config();

// app config
const app = express();
app.use(express.json());
app.use(cors());

//routes
app.use("/api/auth/user", userRoute);
app.use(oAuthRoute);

// Listening to the port 8000
const PORT = process.env.PORT || 8000;

await connectDB();

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

