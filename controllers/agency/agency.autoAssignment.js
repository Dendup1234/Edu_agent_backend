import axios from "axios";
import Student from "../../models/student.js";
import mongoose from "mongoose";
import Agent from "../../models/agent.js";
import { createAutoMessage } from "../../utils/autoMessage.js";
import { sendAgentAssignmentEmail } from "../../utils/sendEmail.js";
import dotenv from "dotenv";
dotenv.config();
// Button to trigger the automatic assignment of student
export const triggerAutoAssignmentWorkflow = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { role } = req.body;
    console.log(process.env.N8N_AUTO_ASSIGNMENT_WEBHOOK_URL);

    if (!["admission_officer", "visa_officer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Use admission_officer or visa_officer",
      });
    }

    const student = await Student.findById(studentId).select(
      "registeredAgency assignedAdmissionOfficer assignedVisaOfficer status",
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (role === "admission_officer" && student.assignedAdmissionOfficer) {
      return res.status(409).json({
        message: "Student already has an admission officer assigned",
      });
    }

    if (role === "visa_officer" && student.assignedVisaOfficer) {
      return res.status(409).json({
        message: "Student already has a visa officer assigned",
      });
    }

    if (role === "visa_officer" && !student.assignedAdmissionOfficer) {
      return res.status(409).json({
        message: "Admission officer must be assigned before visa officer",
      });
    }

    const response = await fetch(process.env.N8N_AUTO_ASSIGNMENT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        studentId,
        agencyId: student.registeredAgency,
        role,
        triggeredBy: "admin_button",
      }),
    });

    // parse response safely
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        message: "n8n workflow returned an error",
        error: data,
      });
    }

    return res.status(200).json({
      message: "Auto assignment workflow triggered successfully",
      data,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      message: "Failed to trigger auto assignment workflow",
    });
  }
};

// Getting the student context
export const getAssignmentStudentContext = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .select(
        "name email registeredAgency status preferredCountry selectedUniversity selectedCourse nationality assignedAdmissionOfficer assignedVisaOfficer",
      )
      .populate("selectedUniversity", "name country")
      .populate("selectedCourse", "name level category");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      student,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting the candidate agents for the students
export const getCandidateAgents = async (req, res) => {
  try {
    const { agencyId, role } = req.query;

    if (!agencyId || !role) {
      return res.status(400).json({
        message: "agencyId and role are required",
      });
    }

    if (!["admission_officer", "visa_officer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const candidates = await Agent.find({
      agency: agencyId,
      systemRole: role,
      isActive: true,
      isVerified: true,
      availabilityStatus: "available",
      $expr: { $lt: ["$currentWorkload", "$maxCapacity"] },
    }).select(
      "name email systemRole agency currentWorkload maxCapacity availabilityStatus specializedCountries specializedUniversities specializedCourseLevels languages experienceLevel description",
    );

    return res.status(200).json({
      candidates,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Saving the agent workflow
export const saveAssignmentFromWorkflow = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { studentId, agentId, role, reason } = req.body;

    if (!studentId || !agentId || !role) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "studentId, agentId and role are required",
      });
    }

    const config = {
      admission_officer: {
        studentField: "assignedAdmissionOfficer",
        status: "admission_assigned",
      },
      visa_officer: {
        studentField: "assignedVisaOfficer",
        status: "visa_assigned",
      },
    }[role];

    if (!config) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const student = await Student.findById(studentId)
      .select(
        "name email registeredAgency status assignedAdmissionOfficer assignedVisaOfficer assignmentHistory",
      )
      .session(session);

    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Student not found" });
    }

    if (student[config.studentField]) {
      await session.abortTransaction();
      return res.status(409).json({
        message: `Student already has ${role} assigned`,
      });
    }

    if (role === "visa_officer" && !student.assignedAdmissionOfficer) {
      await session.abortTransaction();
      return res.status(409).json({
        message: "Admission officer must be assigned first",
      });
    }

    const agent = await Agent.findOne({
      _id: agentId,
      agency: student.registeredAgency,
      systemRole: role,
      isActive: true,
      isVerified: true,
      availabilityStatus: "available",
      $expr: { $lt: ["$currentWorkload", "$maxCapacity"] },
    })
      .select("name email systemRole currentWorkload maxCapacity")
      .session(session);

    if (!agent) {
      await session.abortTransaction();
      return res.status(400).json({
        message:
          "Selected agent is not eligible. Please choose another agent manually.",
      });
    }

    student[config.studentField] = agent._id;
    student.assignedAgent = agent._id;
    student.status = config.status;

    student.assignmentHistory.push({
      role,
      agent: agent._id,
      assignedAt: new Date(),
      assignedBy: "automation",
      reason: reason || "Assigned by n8n auto assignment workflow",
    });

    await student.save({ session });

    await Agent.updateOne(
      { _id: agent._id },
      {
        $addToSet: { assignedStudents: student._id },
        $inc: { currentWorkload: 1 },
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    await sendAgentAssignmentEmail({
      studentEmail: student.email,
      agentEmail: agent.email,
      agentName: agent.name,
      studentName: student.name,
      studentStatus: student.status,
    });

    await createAutoMessage(agent._id, student._id, agent.name);

    return res.status(200).json({
      message: `${role} assigned successfully`,
      studentId: student._id,
      agentId: agent._id,
      assignedAgent: agent,
    });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: "Server error",
    });
  }
};
