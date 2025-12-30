/*
import User from "../models/student.js";
import { OAuth2Client } from "google-auth-library";
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const SCOPES = ["openid", "email", "profile"];

const stateStore = new Set();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

export const authController = {
  initiateGoogleAuth: async (req, res) => {
    try {
      const state = crypto.randomBytes(16).toString("hex");
      stateStore.add(state);
      
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error("Auth initiation error:", error);
      res.status(500).send("Failed to initiate authentication");
    }
  },

  handleGoogleCallback: async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state || !stateStore.has(state)) {
      return res.status(400).send("Invalid OAuth state.");
    }

    stateStore.delete(state);

    try {
      const { tokens } = await client.getToken(code);

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

      res.redirect(`${process.env.FRONTEND_URL}/visa-officer/dashboard`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.status(500).send("Authentication failed");
    }
  },

  handleMobileAuth: async (req, res) => {
    try {
      const { id_token } = req.body;
      
      if (!id_token) {
        return res.status(400).json({ 
          error: "Missing id_token" 
        });
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        return res.status(401).json({ 
          error: "Invalid token" 
        });
      }

      const { sub: googleId, email, name } = payload;

      let user = await User.findOne({ googleId });

      if (!user) {
        user = await User.create({
          googleId,
          email,
          name
        });
      }

      return res.status(200).json({
        success: true,
        message: "Authentication successful",
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name
        }
      });

    } catch (error) {
      console.error("Mobile auth error:", error);
      
      if (error.message.includes("Token used too late")) {
        return res.status(401).json({ 
          error: "Token expired" 
        });
      }
      
      return res.status(500).json({ 
        error: "Authentication failed" 
      });
    }
  }
};
*/