import Student from '../models/student.js';
import Agency from '../models/agency.js';
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const client = new OAuth2Client();

export const authController = {

  handleWebAuth: async (req, res) => {
    try {
      const { id_token } = req.body

      if (!id_token) {
        throw new Error("Missing ID token");
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: ''
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid token payload");

      let user = await Agency.findOne({ googleId: payload.sub });

      if (!user) {
        user = await Agency.create({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name
        });
      }

      const jwtToken = jwt.sign({ googleId: user.googleId, id: user._id }, process.env.JWT_SECRET);

      res.cookie("accessToken",jwtToken).redirect(`${process.env.FRONTEND_URL}/visa-officer/dashboard`);
      console.log(res)
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
        audience: '211640976708-lelad1md8d7dqj8gqoompn7lnfkh0ier.apps.googleusercontent.com'
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        return res.status(401).json({ 
          error: "Invalid token" 
        });
      }

      const { sub: googleId, email, name } = payload;

      let user = await Student.findOne({ googleId });

      if (!user) {
        user = await Student.create({
          googleId,
          email,
          name
        });
      }

      const token = jwt.sign({ googleId: Student.googleId}, process.env.JWT_SECRET);

      return res.status(200).json({message: "Authentication successful", accessToken: token});

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