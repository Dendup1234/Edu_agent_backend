//Imports
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'
import userRoute from "./routes/user.auth.route.js";
import cors from 'cors';
import User from "./models/user.model.js";
import { OAuth2Client } from "google-auth-library";
import crypto from 'crypto';

//config
dotenv.config();

// app config
const app = express();
app.use(express.json());
app.use(cors());

//routes
app.use("/api/auth/user", userRoute);
// Listening to the port 8000
const PORT = process.env.PORT || 8000;

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} = process.env;

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const SCOPES = ["openid", "email", "profile"];

const stateStore = new Set();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

app.get("/", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  stateStore.add(state);

  const authUrl =
    `${GOOGLE_OAUTH_URL}?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  res.redirect(authUrl);
});

app.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || !stateStore.has(state)) {
    return res.status(400).send("Invalid OAuth state.");
  }

  stateStore.delete(state);

  try {

    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL
    });

    if (!tokens.id_token) {
      throw new Error("Missing ID token");
    }

     const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid token payload");

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name
      });
    }

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Authentication failed");
  }
});

// connect DB before server  starts
await connectDB();

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

