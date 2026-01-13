import Agency from "../../models/agency.js";
import Student from "../../models/student.js";
import mongoose from "mongoose";
import Agent from "../../models/agent.js";
import { generatePassword } from "../../utils/password.js";
import { sendAccountEmail } from "../../utils/sendEmail.js";
// Getting profile
export const getProfile = async (req, res) => {
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
};
//Updating a profile
export const updateProfile = async (req, res) => {
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
};
//Getting all the agency
export const getAllAgency = async (req, res) => {
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
        select: "logo",
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
    const userId = req.user.sub;
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
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "token not found" });
    }

    const students = await Student.find({
      registeredAgency: userId,
      isValid: true,
    })
      .select("name education joinDate status statusHistory isValid")
      .lean();

    const leads = students.map((student) => {
      const lastEducation =
        student.education?.length > 0
          ? student.education[student.education.length - 1].qualification
          : null;
      return {
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
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "token not found" });
    }
    const studentList = await Student.find({
      registeredAgency: userId,
      isValid: true,
      selectedCourse: { $ne: null },
      selectedUniversity: { $ne: null },
    })
      .select("name statusHistory selectedCourse selectedUniversity")
      .populate({
        path: "selectedCourse",
        select: "title",
      })
      .populate({
        path: "selectedUniversity",
        select: "name country",
      })
      .lean();
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
      statusHistory: s.statusHistory,
    }));

    return res.status(200).json({
      message: "Success",
      students: student,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// checking the status history of the particular student
export const getStudentAppStatus = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { studentId } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Token not valid" });
    }
    const studentHistory = await Student.findById(studentId).select(
      "statusHistory"
    );
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
    const userId = req.user.sub;
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
//Creating an account of the employee under the agency
export const createAgent = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }
    const { name, email, phone, role } = req.body;

    //check if agent already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res
        .status(409)
        .json({ message: "Agent with this email already exists" });
    }

    //Triming the email
    const normalizedEmail = email.toLowerCase().trim();
    // Generating a new password
    const plainPassword = generatePassword(10);
    // Creating a new agent
    const agent = await Agent.create({
      name,
      email,
      phone,
      password: plainPassword,
      agency: userId,
      role,
    });
    //Sending the email to the particular agent
    // Sending the email to the particular user
    await sendAccountEmail(normalizedEmail, {
      subject: "Your Agent Account is Ready",
      title: "Welcome to EduAgent",
      body: "Your agent account has been created by your agency admin.",
      password: plainPassword,
    });

    //Success
    return res.status(201).json({
      message: "Agent created successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        role: agent.role,
        password: agent.password,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

//Getting all the agent in the employee dashboard
export const getAllAgent = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }
    // finding all the agent inside the organization
    const agent = await Agent.find({
      agency: userId,
    });
    return res.status(200).json({ message: "Success", agents: agent });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting the agent profile
export const getAgentById = async (req, res) => {
  try {
    const { agentId } = req.params;
    // Finding the agent by their id
    const agent = await Agent.findById(agentId)
      .select("-password")
      .populate({
        path: "assignedStudents",
        select:
          "name email phone status nationality selectedUniversity selectedCourse",
        populate: [
          {
            path: "selectedUniversity",
            select: "name country logo",
          },
          {
            path: "selectedCourse",
            select: "title",
          },
        ],
      })
      .lean();
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }
    // Success message
    return res.status(200).json({
      message: "Success",
      agent: agent,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};
