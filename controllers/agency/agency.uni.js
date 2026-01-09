import Agency from "../../models/agency.js";
import University from "../../models/university.js";
import Student from "../../models/student.js";
import Course from "../../models/course.js";
import mongoose from "mongoose";

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

// Getting the university with count of student and course with each uni
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
    const universityIds = agency.partnerUniversities.map((u) => u._id);

    // Course counts grouped by providedBy (university)
    const courseCounts = await Course.aggregate([
      { $match: { providedBy: { $in: universityIds } } },
      { $group: { _id: "$providedBy", count: { $sum: 1 } } },
    ]);

    // Student counts grouped by selectedUniversity
    const studentCounts = await Student.aggregate([
      { $match: { selectedUniversity: { $in: universityIds } } },
      { $group: { _id: "$selectedUniversity", count: { $sum: 1 } } },
    ]);

    // Convert to maps for O(1) lookup
    const courseCountMap = new Map(
      courseCounts.map((x) => [String(x._id), x.count])
    );
    const studentCountMap = new Map(
      studentCounts.map((x) => [String(x._id), x.count])
    );

    // Attach counts to each university
    const universitiesWithCounts = agency.partnerUniversities.map((u) => {
      const id = String(u._id);
      return {
        ...u.toObject(),
        courseCount: courseCountMap.get(id) || 0,
        studentCount: studentCountMap.get(id) || 0,
      };
    });

    return res.status(200).json({
      agency: agency._id,
      count: universitiesWithCounts.length,
      universities: universitiesWithCounts,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
// Getting uni for the student page
export const getUniStudent = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const university = await Agency.findById(agencyId)
      .select("name")
      .populate({
        path: "partnerUniversities",
        match: { status: "Active" },
        select: "logo status",
      });
    return res
      .status(200)
      .json({ message: "Successful", university: university });
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

//Get uni by their university id
export const getUniById = async (req, res) => {
  try {
    const { universityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(universityId)) {
      return res.status(400).json({ message: "Invalid University id format" });
    }
    const university = await University.findById(universityId).populate({
      path: "courses",
      select: "title",
    });
    if (!university) {
      return res.status(404).json({ message: "university does not exist" });
    }
    return res
      .status(200)
      .json({ message: "Extracted successfully", unversity: university });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};

// Search query in the uni for the agency
export const searchUniByName = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }

    // Load only partnerUniversities that match the name (inside this agency)
    const agency = await Agency.findById(userId)
      .select("partnerUniversities")
      .populate({
        path: "partnerUniversities",
        match: { name: { $regex: q, $options: "i" } }, // search
        select: "name country status about mission websiteURL logo",
      });

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    const universities = agency.partnerUniversities || [];
    const universityIds = universities.map((u) => u._id);

    // If no universities match, return empty list
    if (universityIds.length === 0) {
      return res.status(200).json({
        count: 0,
        universities: [],
      });
    }

    // Course counts per university
    const courseCounts = await Course.aggregate([
      { $match: { providedBy: { $in: universityIds } } },
      { $group: { _id: "$providedBy", count: { $sum: 1 } } },
    ]);

    //Student counts per university
    const studentCounts = await Student.aggregate([
      { $match: { selectedUniversity: { $in: universityIds } } },
      { $group: { _id: "$selectedUniversity", count: { $sum: 1 } } },
    ]);

    const courseCountMap = new Map(
      courseCounts.map((x) => [String(x._id), x.count])
    );
    const studentCountMap = new Map(
      studentCounts.map((x) => [String(x._id), x.count])
    );

    // Attach counts
    const universitiesWithCounts = universities.map((u) => {
      const id = String(u._id);
      return {
        ...u.toObject(),
        courseCount: courseCountMap.get(id) || 0,
        studentCount: studentCountMap.get(id) || 0,
      };
    });

    return res.status(200).json({
      count: universitiesWithCounts.length,
      universities: universitiesWithCounts,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};

// Dashboard for the uni
export const getUniDashboard = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "token invalid" });
    }
    // Getting the active uni count
    const uniActive = await Agency.findById(userId)
      .select("_id")
      .populate({
        path: "partnerUniversities",
        select: "_id",
        match: { status: "Active" },
      })
      .lean();

    const uniActiveCount = uniActive.partnerUniversities.length;
    // Getting the inactive
    const uniInactive = await Agency.findById(userId)
      .select("_id")
      .populate({
        path: "partnerUniversities",
        select: "_id",
        match: { status: "Inactive" },
      })
      .lean();
    const uniInactiveCount = uniInactive.partnerUniversities.length;

    // Getting the active course count
    const courseActive = await Agency.findById(userId)
      .select("partnerUniversities")
      .populate({
        path: "partnerUniversities",
        select: "courses",
        match: { status: "Active" },
        populate: {
          path: "courses",
          select: "_id",
          match: { status: "open" },
        },
      })
      .lean();

    const courseActiveCount = courseActive.partnerUniversities.reduce(
      (total, uni) => total + (uni.courses?.length || 0),
      0
    );

    // Getting the inactive course count
    const courseInactive = await Agency.findById(userId)
      .select("partnerUniversities")
      .populate({
        path: "partnerUniversities",
        select: "courses",
        match: { status: "Active" },
        populate: {
          path: "courses",
          select: "_id",
          match: { status: "closed" },
        },
      })
      .lean();

    const courseInactiveCount = courseInactive.partnerUniversities.reduce(
      (total, uni) => total + (uni.courses?.length || 0),
      0
    );

    //Success
    return res.status(200).json({
      message: "Success",
      activeUni: uniActiveCount,
      inactiveUni: uniInactiveCount,
      activeCourse: courseActiveCount,
      inactiveCourse: courseInactiveCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};
