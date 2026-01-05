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
import mongoose from "mongoose";
import Course from "../models/course.js";

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
    //Find by id and update
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
router.post("/universities", protect, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, logo, websiteURL, country, about, mission, status } =
      req.body;
    const university = await University.create({
      name,
      userId,
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
// Getting the particular universities from the agency
router.get("/universities", protect, async (req, res) => {
  try {
    const userId = req.user.sub;
    // No token stored
    if (!userId) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const agency = await Agency.findById(userId).populate({
      path: "partnerUniversities",
      select: "name country status about mission websiteURL logo",
    });
    // Agency not found
    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    return res.status(200).json({
      count: agency.partnerUniversities.length,
      universities: agency.partnerUniversities,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

//Creating a particular courses for the specific university
router.post(
  "/universities/:universityId/courses",
  protect,
  async (req, res) => {
    try {
      const { universityId } = req.params;
      const userId = req.user.sub;
      const {
        title,
        level,
        about,
        duration,
        tuitionFee,
        description,
        entryRequirements,
        status,
        intakes,
      } = req.body;
      //Checking the validity of the university id
      if (!mongoose.Types.ObjectId.isValid(universityId)) {
        return res
          .status(400)
          .json({ message: "Invalid University id format" });
      }
      // Checking if the university exist
      const university = await University.findOne({
        _id: universityId,
      });
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }

      // Checking if the university is connected to the particular agency
      const agency = await Agency.findOne({
        _id: userId,
        partnerUniversities: universityId,
      });
      if (!agency) {
        return res.status(404).json({
          message: "Particular university is not connect to the agency",
        });
      }

      // Creating a course
      const course = await Course.create({
        title,
        level,
        about,
        duration,
        tuitionFee,
        description,
        entryRequirements,
        status,
        intakes,
      });
      //adding the course id to the university
      await University.findByIdAndUpdate(universityId, {
        $addToSet: { courses: course._id },
      });

      return res
        .status(200)
        .json({ message: "Course created successfully", course: course });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "server error" });
    }
  }
);
//All agency
router.get("/", protect, async (req, res) => {
  try {
    const agency = await Agency.find().select("-password").lean();
    return res.json({
      count: agency.length,
      agency,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// Getting the courses from the particular university
export default router;
