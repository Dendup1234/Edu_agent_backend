import Agency from "../../models/agency.js";
import University from "../../models/university.js";
import mongoose from "mongoose";
import Course from "../../models/course.js";

//Creating a particular courses for the specific university
export const createCourse = async (req, res) => {
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
      return res.status(400).json({ message: "Invalid University id format" });
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
      userId,
      providedBy: universityId,
      createdBy: userId,
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
};
// updating the courses
export const updateCourse = async (req, res) => {
  try {
    const { universityId, courseId } = req.params;
    const userId = req.user.sub;
    if (!userId) {
      return res.status(404).json({ message: "No token" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(universityId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const update = req.body;
    //updating the course
    const course = await Course.findByIdAndUpdate(courseId, update, {
      new: true,
      runValidators: true,
    })
      .select("-_id")
      .lean();
    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }
    return res.status(200).json({
      message: "Course updated successfully",
      course: course,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};
//Getting the course from particular uni
export const getCourse = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(404).json({ message: "No token" });
    }
    const { universityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(universityId)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const courses = await University.findById(universityId).populate({
      path: "courses",
      select:
        "title level about duration tutionfee description entryRequirements status intakes",
    });
    if (!courses) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({
      message: "Successful",
      course: courses,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deactivating the course
export const deactivateCourse = async (req, res) => {
  try {
    const { universityId, courseId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(universityId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        status: "closed",
      },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ message: "Course is not found" });
    }
    return res
      .status(200)
      .json({ message: "Course deactivated sucessfully", course: course });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Getting all the courses from the agency only the title
export const getCourseByAgency = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const courses = await Course.find({ createdBy: agencyId })
      .select("title")
      .lean();
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses" });
    }

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
    const userId = req.user.sub;
    if (!userId) {
      return res.status(404).json({ message: "Unauthorized token" });
    }
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid Id" });
    }
    const courses = await Course.findById(courseId)
      .populate({
        path: "providedBy",
        select: "logo",
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
