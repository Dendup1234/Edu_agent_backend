import Student from "../../models/student.js";
import Agency from "../../models/agency.js";
import Course from "../../models/course.js";

import mongoose from "mongoose";
import { selectAgency } from "./student.profile.js";

// Searching a particular course by name
export const searchCourseByName = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    // searching in the course
    const course = await Course.find({
      createdBy: agencyId,
      title: { $regex: q, $options: "i" },
    }).select("_id title");

    return res.status(200).json({ message: "Success", course: course });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};

//When student select the particular course with the uni
export const selectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.sub;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    // finding the info about the course
    const course = await Course.findById(courseId)
      .select("title providedBy")
      .populate({
        path: "providedBy",
        select: "_id name",
      })
      .lean();

    if (!course || !course.providedBy?._id) {
      return res.status(404).json({ message: "Course not found" });
    }
    // if the course exist
    const existing = await Student.findById(userId).select("selectedCourse");
    if (!existing)
      return res.status(404).json({ message: "Student not found" });

    //don’t allow selecting a course if one is already selected
    if (existing.selectedCourse) {
      return res.status(409).json({
        message: "You already selected a course ",
      });
    }

    // updating the students 
    const student = await Student.findByIdAndUpdate(
      userId,
      {
        selectedUniversity: course.providedBy._id,
        selectedCourse: courseId,
      },
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ message: "Success", student });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "server error" });
  }
};
