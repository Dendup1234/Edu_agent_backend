import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  sendOtp,
  resendOtp,
  verifyOtp,
  login,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  setNewPassword,
} from "../controllers/agency.auth.js";
import Agency from "../models/agency.js";
import University from "../models/university.js";

// Router import
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/password-reset/send-otp", sendPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/set-new", setNewPassword);

//profiles specific
router.get("/profile", protect, async (req, res) => {
  try {
    const user_id = req.user.sub;
    //Hides password and return plain json format
    const agency = await Agency.findById(user_id).select("-password").lean();
    if (!agency) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      profile: agency,
      tokenUser: { userId: user_id, email: req.user.email },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

//updating profile
router.patch("/profile", protect, async (req, res) => {
  try {
    const userId = req.user.sub;
    const update = req.body;
    // forbidden fields to be updated
    const forbidden = ["_id", "password"];
    forbidden.forEach((field) => delete update[field]);
    //Find by id and updateeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJnb29nbGVJZCI6IjExMjM2NzE5NDE5MDUxOTczNTAyNCIsImlkIjoiNjk1N2YwOTM1NTgyNTdmNWZkZjljMGY5IiwiaWF0IjoxNzY3NDMwNjc2fQ.Gaph65C38IBZ0MIJIr5MP_DvqFS5WcZmK4NZaJFpeds
    const updatedAgency = await Agency.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    if (!updatedAgency) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Profile updated",
      profile: updatedAgency,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Creating a university
router.post("/university", protect, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, logo, websiteURL, country, about, mission, status } =
      req.body;
    const university = await University.create({
      name,
      logo,
      websiteURL,
      country,
      about,
      mission,
      status,
    });
    //Referencing the agency to the university
    const agency = await Agency.findByIdAndUpdate(userId, {
      $addToSet: { partnerUniversities: university._id },
    });
    if (!agency) {
      return res.status(404).json({ message: "Unauthorized" });
    }

    return res.status(201).json({
      message: "University created successfully",
      university: university,
      agency: {
        agency_id: agency._id,
        partnerUniversities: agency.partnerUniversities,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
