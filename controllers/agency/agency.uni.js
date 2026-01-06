import Agency from "../../models/agency.js";
import University from "../../models/university.js";
import mongoose from "mongoose";
import Course from "../../models/course.js";

// Creating university
export const createUni = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, logo, websiteURL, country, about, mission, status } =
      req.body;
    // Checking if the userid exist
    if (!userId) {
      return res.status(404).json({ message: "User_id not found" });
    }
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
    const agency = await Agency.findByIdAndUpdate(
      userId,
      {
        $addToSet: { partnerUniversities: university._id },
      },
      { new: true }
    );
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
};

// Getting the university
export const getUni = async (req, res) => {
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
      agency: agency._id,
      count: agency.partnerUniversities.length,
      universities: agency.partnerUniversities,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Updating the university
export const updateUni = async (req, res) => {
  try {
    const { universityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(universityId)) {
      return res.status(400).json({ message: "Invalid University id format" });
    }
    // update body
    const update = req.body;
    // forbidden fields to update
    const forbidden = ["_id"];
    forbidden.forEach((field) => delete update[field]);
    const updateUni = await University.findByIdAndUpdate(universityId, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updateUni) {
      return res.status(404).json({ message: "University does not exist" });
    }
    return res.json({
      message: "University update successful",
      university: updateUni,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deactivating a university
export const deactivateUni = async (req, res) => {
  try {
    const { universityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(universityId)) {
      return res.status(400).json({ message: "Invalid University id format" });
    }
    const university = await University.findByIdAndUpdate(
      universityId,
      { status: "Inactive" },
      { new: true }
    );
    if (!university) {
      return res.status(404).json({ message: "University not found" });
    }
    return res
      .status(200)
      .json({ message: "University deactivated successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};
