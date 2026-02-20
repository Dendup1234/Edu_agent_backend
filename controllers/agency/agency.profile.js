import agency from "../../models/agency.js";
import Agency from "../../models/agency.js";
import Student from "../../models/student.js";
import mongoose from "mongoose";

// Getting profile
export const getProfile = async (req, res) => {
  try {
    const user_id = req.user.agencyId;
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
};

//Updating a profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.agencyId;
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
};

//Getting all the agency
export const getAllAgency = async (req, res) => {
  try {
    const agency = await Agency.find({ isVerified: true })
      .select("-password")
      .lean();
    return res.json({
      count: agency.length,
      agency,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Card stats for all the agency
export const getAgencyCard = async (req, res) => {
  try {
    const agencies = await Agency.aggregate([
      { $match: { isVerified: true } },

      //outer join

      //student count
      {
        $lookup: {
          from: "students",
          let: { agencyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$registeredAgency", "$$agencyId"] },
                    { $eq: ["$isValid", true] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "studentCountAgg",
        },
      },
      // course counts
      {
        $lookup: {
          from: "courses",
          let: { agencyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$createdBy", "$$agencyId"] },
                    { $eq: ["$status", "open"] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "courseCountAgg",
        },
      },
      //to show the required fields
      {
        $project: {
          organizationName: 1,
          name: 1,
          email: 1,
          phone: 1,
          profileUrl: 1,
          isVerified: 1,
          createdAt: 1,
          uniCount: { $size: { $ifNull: ["$partnerUniversities", []] } },
          // counts from lookups
          studentCount: {
            $ifNull: [{ $arrayElemAt: ["$studentCountAgg.count", 0] }, 0],
          },
          courseCount: {
            $ifNull: [{ $arrayElemAt: ["$courseCountAgg.count", 0] }, 0],
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.status(200).json({
      message: "Success",
      agencies,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting agency by their id
export const getAgencybyId = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(agencyId)) {
      return res.status(400).json({ message: "Invalid agency id" });
    }
    // Getting the agency by their particular id
    const agency = await Agency.findById(agencyId)
      .select("-password -googleId")
      .populate({
        path: "partnerUniversities",
        select: "profileUrl",
      }); // hide sensitive fields

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    return res.status(200).json({ message: "Successful", agency: agency });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lead profile dashboard
export const getLeadDashboard = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // finding the count of the new lead
    const newLead = await Student.find({
      registeredAgency: userId,
      status: "new",
    });
    const newLeadCount = newLead.length;

    // finding the count of the pending lead
    const pendingLead = await Student.find({
      registeredAgency: userId,
      status: "contacted",
    });
    const pendingLeadCount = pendingLead.length;
    // finding the count of converted lead
    const convertedLead = await Student.find({
      registeredAgency: userId,
      status: "converted",
    });
    const convertedLeadCount = convertedLead.length;
    // finding the lead lost count
    const lostLead = await Student.find({
      registeredAgency: userId,
      status: "lost",
    });
    const lostLeadCount = lostLead.length;

    return res.status(200).json({
      message: "success",
      newLeadCount: newLeadCount,
      pendingLeadCount: pendingLeadCount,
      convertedLeadCount: convertedLeadCount,
      lostLeadCount: lostLeadCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Getting the list of students in the lead table and the student table
export const getStudentLead = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "token not found" });
    }

    const students = await Student.find({
      registeredAgency: userId,
      isValid: true,
    })
      .select("_id name education joinDate status statusHistory isValid")
      .lean();

    const leads = students.map((student) => {
      const lastEducation =
        student.education?.length > 0
          ? student.education[student.education.length - 1].qualification
          : null;
      return {
        id: student._id,
        name: student.name,
        qualification: lastEducation,
        joinDate: student.joinDate,
        status: student.status, // current status
        statusHistory: student.statusHistory || [], //all statuses with dates
        valid: student.isValid,
      };
    });

    return res.status(200).json({
      count: leads.length,
      leads,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting the student list if they have a selected course and uni
export const getStudentList = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "token not found" });
    }
    const studentList = await Student.find({
      registeredAgency: userId,
      isValid: true,
      selectedCourse: { $ne: null },
      selectedUniversity: { $ne: null },
    })
      .select(
        "name statusHistory selectedCourse selectedUniversity assignedAgent",
      )
      .populate({
        path: "selectedCourse",
        select: "title",
      })
      .populate({
        path: "selectedUniversity",
        select: "name country",
      })
      .populate({
        path: "assignedAgent",
        select: "name",
      })
      .lean();

    console.log(studentList);
    // Finding the count of student
    const studentCount = studentList.length;

    // Creating the custom map of object
    const student = studentList.map((s) => ({
      student: {
        id: s._id,
        name: s.name,
      },
      course: {
        id: s.selectedCourse?._id,
        title: s.selectedCourse?.title,
      },
      university: {
        id: s.selectedUniversity?._id,
        name: s.selectedUniversity?.name,
        country: s.selectedUniversity?.country,
      },
      agent: {
        id: s.assignedAgent?._id,
        name: s.assignedAgent?.name,
      },
      statusHistory: s.statusHistory,
    }));

    return res.status(200).json({
      message: "Success",
      students: student,
      studentCount: studentCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// checking the status history of the particular student
export const getStudentAppStatus = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    const { studentId } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Token not valid" });
    }
    const studentHistory =
      await Student.findById(studentId).select("statusHistory");
    return res
      .status(200)
      .json({ message: "Successful", student: studentHistory });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Searching student by their name
export const searchLeadByName = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    // Finding the student by their names
    const students = await Student.find({
      registeredAgency: userId,
      isValid: true,
      name: { $regex: q, $options: "i" },
    })
      .select("name education joinDate status statusHistory isValid")
      .lean();

    const leads = students.map((student) => {
      const lastEducation =
        student.education?.length > 0
          ? student.education[student.education.length - 1].qualification
          : null;
      if (!students) {
        return res.status(404).json({ message: "Student not found" });
      }
      return res.status(200).json({
        name: student.name,
        qualification: lastEducation,
        joinDate: student.joinDate,
        status: student.status, // current status
        statusHistory: student.statusHistory || [], //all statuses with dates
        valid: student.isValid,
      });
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
