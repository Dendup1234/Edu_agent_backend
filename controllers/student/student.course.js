import Student from "../../models/student.js";
import Course from "../../models/course.js";
import mongoose from "mongoose";

// Searching a particular course by name
export const searchCourseByName = async (req, res) => {
  try {
    const userId = req.user.sub;
    // fetching the agency id from the student schema
    const student = await Student.findById(userId).select("registeredAgency");
    // getting the agency id
    const agencyId = student?.registeredAgency;
    const q = (req.query.q || "").trim();
    console.log(agencyId);
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Invalid agencyId" });
    }

    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }

    // Protect against regex injection / heavy queries
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const qSafe = escapeRegex(q);

    const course = await Course.find({
      createdBy: agencyId,
      title: { $regex: qSafe, $options: "i" },
    }).select("_id title");

    return res
      .status(200)
      .json({ message: "Success", course, count: course.length });
  } catch (e) {
    console.error("searchCourseByName error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//When student select the particular course with the uni
export const selectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.sub;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId)
      .select("providedBy")
      .populate({ path: "providedBy", select: "_id name" })
      .lean();

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.providedBy?._id) {
      return res
        .status(400)
        .json({ message: "Course has no university attached" });
    }

    // atomic update: only set if student hasn't selected before
    const student = await Student.findOneAndUpdate(
      { _id: userId, selectedCourse: { $in: [null, undefined] } },
      {
        selectedUniversity: course.providedBy._id,
        selectedCourse: courseId,
      },
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(409).json({ message: "You already selected a course" });
    }

    return res.status(200).json({ message: "Success", student });
  } catch (e) {
    console.error("selectCourse error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Getting all the courses from the agency only the title and when the status is open
export const getCourseByAgency = async (req, res) => {
  try {
    const userId = req.user.sub;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // fetching the agency id from the student schemas
    const student = await Student.findById(userId).select("registeredAgency");
    // getting the agency id
    const agencyId = student?.registeredAgency;

    const courses = await Course.find({
      createdBy: agencyId,
      status: "open",
    })
      .select("title")
      .lean();

    return res.status(200).json({
      message: "Course extracted successfully",
      courses: courses,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Getting the course by the id
export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const courses = await Course.findById(courseId)
      .populate({
        path: "providedBy",
        select: "profileUrl",
      })
      .lean();
    if (!courses) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res
      .status(200)
      .json({ message: "Extracted successfully", course: courses });
  } catch (e) {
    console.log(e);
    return res.status(200).json({ message: "Server error" });
  }
};
