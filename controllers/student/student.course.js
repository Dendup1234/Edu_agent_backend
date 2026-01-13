import Student from "../../models/student.js";
import Agency from "../../models/agency.js";
import Course from "../../models/course.js";

import mongoose from "mongoose";
import { selectAgency } from "./student.profile.js";

// Searching a particular course
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

//When student select the particular course
export const selectCourse = async (req, res) => {};
