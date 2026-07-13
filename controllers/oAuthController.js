import Student from "../models/student.js";
import Agency from "../models/agency.js";
import Agent from "../models/agent.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const client = new OAuth2Client();

export const authController = {
  handleWebAuth: async (req, res) => {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        throw new Error("Missing ID token");
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience:
          "1080035045964-llt4obq8aeun39r89artl5qf0n4tvjrt.apps.googleusercontent.com",
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid token payload");

      let user = await Agency.findOne({ googleId: payload.sub });

      if (user && !user.googleId) {
        user.googleId = payload.sub
        await user.save()
      }

      if (!user) {
        user = await Agency.create({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          profile: payload.picture
        });
      }

      const jwtToken = jwt.sign(
        { agencyId: user._id.toString(), actor: "Agency" },
        process.env.JWT_SECRET
      );

      return res
        .status(200)
        .json({ message: "Authentication successful", accessToken: jwtToken });
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
          error: "Missing id_token",
        });
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience:
          "211640976708-lelad1md8d7dqj8gqoompn7lnfkh0ier.apps.googleusercontent.com",
      });

      const payload = ticket.getPayload();

      if (!payload) {
        return res.status(401).json({
          error: "Invalid token",
        });
      }

      let user = await Student.findOne({ googleId: payload.sub});

      if (user && !user.googleId) {
        user.googleId = payload.sub
        await user.save()
      }

      if (!user) {
        user = await Student.create({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          profileUrl: payload.picture
        });
      }

      const jwtToken = jwt.sign(
        { sub: user._id.toString(), actor: "Student" },
        process.env.JWT_SECRET
      );

      return res
        .status(200)
        .json({ message: "Authentication successful", accessToken: jwtToken });
    } catch (error) {
      console.error("Mobile auth error:", error);

      if (error.message.includes("Token used too late")) {
        return res.status(401).json({
          error: "Token expired",
        });
      }

      return res.status(500).json({
        error: "Authentication failed",
      });
    }
  },

  handleAgentAuth: async (req, res) => {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        return res.status(400).json({
          error: "Missing id_token",
        });
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        return res.status(401).json({
          error: "Invalid token",
        });
      }

      let user = await Agent.findOne({
        $or: [{ googleId: payload.sub }, { email: payload.email }],
      }).select("agency systemRole roleId isVerified isActive name email googleId");

      if (!user) {
        return res.status(404).json({
          error: "Agent not found. Please ask your agency to add you first.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }

      const jwtToken = jwt.sign(
        {
          id: user._id.toString(),
          agencyId: user.agency.toString(),
          email: user.email,
          isVerified: user.isVerified,
          actor: "Agent",
          systemRole: user.systemRole,
        },
        process.env.JWT_SECRET,
      );

      return res.status(200).json({
        message: "Authentication successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          systemRole: user.systemRole,
          roleId: user.roleId,
          isVerified: user.isVerified,
          isActive: user.isActive,
        },
        accessToken: jwtToken,
      });
    } catch (error) {
      console.error("Agent Google auth error:", error);

      if (error.message?.includes("Token used too late")) {
        return res.status(401).json({
          error: "Token expired",
        });
      }

      return res.status(500).json({
        error: "Authentication failed",
      });
    }
  },
};
