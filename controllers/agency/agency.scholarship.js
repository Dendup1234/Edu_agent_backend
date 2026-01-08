import mongoose from "mongoose";
import Scholarship from "../../models/scholarship.js";

// Create a scholarship
export const createScholarship = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(404).json({ message: "Token expired" });
    }
    const {
      title,
      about,
      howToApply,
      amount,
      eligiblility,
      fieldOfStudy,
      applicationDateline,
      status,
      providedBy,
    } = req.body;
    // creating a new scholarship
    const scholarship = await Scholarship.create({
      title,
      about,
      howToApply,
      amount,
      eligiblility,
      fieldOfStudy,
      applicationDateline,
      status,
      providedBy,
      createdBy: userId,
    });

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not create" });
    }
    return res.status(200).json({
      message: "Scholarship created successfully",
      scholarship: scholarship,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting all the Scholarship for agency
export const getAllScholarship = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "Token expired" });
    }
    // getting all the scholarship from the agency
    const scholarship = await Scholarship.find({
      createdBy: userId,
    });
    if (!scholarship) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({
      message: "Successful",
      scholarship: scholarship,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Getting all scholarship from agency (when open) for student from partimeter
export const getAllScholarshipStudent = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    // Finding the scholarship from agency
    const scholarship = await Scholarship.find({
      createdBy: agencyId,
      status: "open",
    });

    return res.status(200).json({
      message: "Successful",
      scholarship: scholarship,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting all the scholarship at landing page
export const getAllScholarshipLanding = async (req, res) => {
  try {
    // Finding the scholarship from agency
    const scholarship = await Scholarship.find({
      status: "open",
    });
    return res.status(200).json({
      message: "Successful",
      scholarship: scholarship,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting the scholarship by their id
export const getScholarshipById = async (req, res) => {
  try {
    const { scholarshipId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(scholarshipId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    // finding the scholarship by id
    const scholarship = await Scholarship.findById(scholarshipId);

    return res.status(200).json({
      message: "Successful",
      scholarship: scholarship,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Updating the scholarship
export const updateScholarship = async (req, res) => {
  try {
    const update = req.body;
    const { scholarshipId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(scholarshipId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const scholarship = await Scholarship.findByIdAndUpdate(
      scholarshipId,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).lean();
    if (!scholarship) {
      return res.status(400).json({ message: "Unsuccessful" });
    }
    return res
      .status(200)
      .json({ message: "Successfully updated", scholarship: scholarship });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deactivating the scholarship
export const deactivateScholarship = async (req, res) => {
  try {
    const { scholarshipId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(scholarshipId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const scholarship = await Scholarship.findByIdAndUpdate(
      scholarshipId,
      {
        status: "closed",
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();
    if (!scholarship) {
      return res.status(400).json({ message: "Unsuccessful" });
    }
    return res
      .status(200)
      .json({ message: "Successfully deactivated", scholarship: scholarship });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
