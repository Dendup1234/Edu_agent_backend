import Student from "../models/student.js";
import Agency from "../models/agency.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const client = new OAuth2Client();

function issueAccessToken({ user }) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET
  );
}

export const authController = {
  handleWebAuth: async (req, res) => {
    try {
      const { id_token } = req.body;

      const payload = await verifyGoogleIdToken({
        id_token,
        client: webClient,
      });

      const email = payload.email;

      if (!email) {
        return res
          .status(400)
          .json({ message: "Google account missing email" });
      }

      let user = await Agency.findOne({ googleId });

      const accessToken = issueAccessToken({ user});

      return res.status(200).json({
        message: "Authentication successful",
        accessToken,
        user: {
          id: user._id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Google WEB auth error:", error);
      const status = error?.status || 500;
      return res
        .status(status)
        .json({ message: error?.message || "Authentication failed" });
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

      const { sub: googleId, email, name } = payload;

      let user = await Student.findOne({ googleId });

      if (!user) {
        user = await Student.create({
          googleId,
          email,
          name,
        });
      }

      const jwtToken = jwt.sign(
        { googleId: user.googleId, id: user._id },
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
};
