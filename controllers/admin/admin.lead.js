import Student from "../../models/student.js";

// Lead profile dashboard (globals)
export const getLeadDashboard = async (req, res) => {
  try {
    const result = await Student.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // normalize counts
    const counts = {
      new: 0,
      contacted: 0,
      converted: 0,
      lost: 0,
    };

    result.forEach((r) => {
      if (counts[r._id] !== undefined) {
        counts[r._id] = r.count;
      }
    });

    return res.status(200).json({
      message: "success",
      newLeadCount: counts.new,
      pendingLeadCount: counts.contacted,
      convertedLeadCount: counts.converted,
      lostLeadCount: counts.lost,
      totalLeads:
        counts.new + counts.contacted + counts.converted + counts.lost,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting the list of students in the lead table and the student table
export const getStudentLead = async (req, res) => {
  try {
    const students = await Student.find()
      .select(
        " _id name education status statusHistory isValid createdAt registeredAgency",
      )
      .populate({
        path: "registeredAgency",
        select: "organizationName",
      })
      .lean();

    const leads = students.map((student) => {
      const lastEducation =
        student.education?.length > 0
          ? student.education[student.education.length - 1].qualification
          : null;
      return {
        name: student.name,
        qualification: lastEducation,
        joinDate: student.createdAt,
        organisationName: student.registeredAgency.organizationName,
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

// Searching student by their name
export const searchLeadByName = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    // Finding the student by their names
    const students = await Student.find({
      isValid: true,
      name: { $regex: q, $options: "i" },
    })
      .select(
        "name education status statusHistory isValid registeredAgency createdAt",
      )
      .populate({
        path: "registeredAgency",
        select: "organizationName",
      })
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
        joinDate: student.createdAt,
        organizationName: student.registeredAgency.organizationName,
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

// Getting the student list if they have a selected course and uni
export const getStudentList = async (req, res) => {
  try {
    const studentList = await Student.find({
      isValid: true,
      selectedCourse: { $ne: null },
      selectedUniversity: { $ne: null },
    })
      .select(
        "name statusHistory selectedCourse selectedUniversity assignedAgent registeredAgency",
      )
      .populate({
        path: "registeredAgency",
        select: "organizationName",
      })
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
    // Finding the count of student
    const studentCount = studentList.length;

    // Creating the custom map of object
    const student = studentList.map((s) => ({
      student: {
        id: s._id,
        name: s.name,
      },
      organizationName: {
        id: s.registeredAgency._id,
        name: s.registeredAgency.organizationName,
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

// searching student by name
export const searchStudentByName = async (req, res) => {
  try {
    const q = (req.query.name || "").trim();
    if (!q) {
      return res
        .status(400)
        .json({ message: "Query param 'name' is required" });
    }

    const studentList = await Student.find({
      isValid: true,
      selectedCourse: { $ne: null },
      selectedUniversity: { $ne: null },
      name: { $regex: q, $options: "i" },
    })
      .select(
        "name statusHistory selectedCourse selectedUniversity assignedAgent registeredAgency",
      )
      .populate({ path: "registeredAgency", select: "organizationName" })
      .populate({ path: "selectedCourse", select: "title" })
      .populate({ path: "selectedUniversity", select: "name country" })
      .populate({ path: "assignedAgent", select: "name" })
      .lean();

    const students = studentList.map((s) => ({
      student: {
        id: s._id,
        name: s.name,
      },
      organizationName: s.registeredAgency
        ? {
            id: s.registeredAgency._id,
            name: s.registeredAgency.organizationName,
          }
        : null,
      course: s.selectedCourse
        ? { id: s.selectedCourse._id, title: s.selectedCourse.title }
        : null,
      university: s.selectedUniversity
        ? {
            id: s.selectedUniversity._id,
            name: s.selectedUniversity.name,
            country: s.selectedUniversity.country,
          }
        : null,
      agent: s.assignedAgent
        ? { id: s.assignedAgent._id, name: s.assignedAgent.name }
        : null,
      statusHistory: s.statusHistory || [],
    }));

    return res.status(200).json({
      message: "Success",
      students,
      studentCount: students.length,
      query: q,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

