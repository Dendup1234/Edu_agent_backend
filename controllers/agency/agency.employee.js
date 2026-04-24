import Agent from "../../models/agent.js";
import Role from "../../models/role.js";
import { generatePassword } from "../../utils/password.js";
import {
  sendAccountEmail,
  sendAgentAssignmentEmail,
} from "../../utils/sendEmail.js";
import Mentor from "../../models/mentor.js";
import bcrypt from "bcryptjs";
import Student from "../../models/student.js";
import mongoose from "mongoose";
import Conversation from "../../models/conversation.js";
import Message from "../../models/message.js";
import { getSenderDisplayInfo } from "../../utils/senderInfoMessage.js";
import { sendStudentMessageuPushNotification } from "../../utils/notification.js";

//Creating an account of the employee under the agency
export const createAgent = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }

    const { name, email, phone, systemRole, roleId } = req.body;

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
    //encrypting the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    // Creating a new agent
    const agent = await Agent.create({
      name,
      email,
      phone,
      password: hashedPassword,
      agency: userId,
      systemRole,
      roleId,
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
        role: agent.roleId,
        systemRole: agent.systemRole,
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
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }
    // finding all the agent inside the organization
    const agent = await Agent.find({
      agency: userId,
    }).populate({
      path: "roleId",
      select: "name permissions",
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
      .populate([
        {
          path: "assignedStudents",
          select:
            "name email phone status nationality selectedUniversity selectedCourse",
          populate: [
            {
              path: "selectedUniversity",
              select: "name country profileUrl",
            },
            {
              path: "selectedCourse",
              select: "title",
            },
          ],
        },
        {
          path: "roleId",
          select: "name permissions",
        },
      ])
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

//Updating the agent
export const updateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const update = req.body;
    // updating the agent
    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      update,
      { new: true },
      { runValidators: true },
    );
    return res
      .status(200)
      .json({ message: "Agent updated successfully", agent: updatedAgent });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};

// Deactivate the agent
export const deactivateAgent = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token not found" });
    }
    const { agentId } = req.params;
    // updating the agent
    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      { isActive: false },
      { new: true, runValidators: true },
    );
    return res
      .status(200)
      .json({ message: "Agent deactivated successfully", agent: updatedAgent });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};
//Creating a role by the agency
export const createRole = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token not found" });
    }
    const { name, permissions } = req.body;

    // Creating a new role
    const role = await Role.create({ agencyId: userId, name, permissions });

    //Check if the role exists
    if (!role) {
      return res.status(404).json({ message: "Role create unsuccessfuly" });
    }
    //response
    return res.status(200).json({ message: "Success", role: role });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};

//Getting the all the roles
export const getAllRole = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token not found" });
    }
    // getting all the roles
    const roles = await Role.find({
      agencyId: userId,
    });

    return res.status(200).json({ message: "Success", roles: roles });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};

//Updating the role profile
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    // update body
    const update = req.body;
    const updateRole = await Role.findByIdAndUpdate(roleId, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updateRole) {
      return res.status(404).json({ message: "Role is not created" });
    }
    return res
      .status(200)
      .json({ message: "update successfully", role: updateRole });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};

// Deactivating the role
export const deactivateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    // Deactivating the role
    const deactivateRole = await Role.findByIdAndUpdate(roleId, {
      isActive: false,
    });
    return res
      .status(200)
      .json({ message: "role dactivated successfully", role: deactivateRole });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};

// Search role by name (within the agency)
export const searchRoleByName = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const { name } = req.query;

    if (!agencyId) {
      return res.status(401).json({ message: "Token not found" });
    }

    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const roles = await Role.find({
      agencyId: agencyId,
      name: { $regex: name, $options: "i" },
    });

    return res.status(200).json({
      message: "Search successful",
      total: roles.length,
      roles: roles,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Search employee
export const searchEmployee = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token not found" });
    }
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }

    // Employee search through query
    const agent = await Agent.find({
      agency: userId,
      name: { $regex: q, $options: "i" },
    })
      .populate({
        path: "roleId",
        select: "name permissions",
      })
      .lean();

    return res.status(200).json({
      message: "Successful",
      Agent: agent,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error " });
  }
};

//Creating an account of the mentor under the agency
export const createMentor = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }

    const { name, email, phone } = req.body;

    //check if agent already exists
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return res
        .status(409)
        .json({ message: "Agent with this email already exists" });
    }
    // Getting the day that the mentor is created for join date
    const joinDate = new Date();
    //Trim ing the email
    const normalizedEmail = email.toLowerCase().trim();
    // Generating a new password
    const plainPassword = generatePassword(10);
    //encrypting the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    // Creating a new agent
    const mentor = await Mentor.create({
      name,
      email,
      phone,
      password: hashedPassword,
      joinDate: joinDate,
      partnerAgency: userId,
    });
    //Sending the email to the particular mentor
    await sendAccountEmail(normalizedEmail, {
      subject: "Your Mentor Account is Ready",
      title: "Welcome to EduAgent",
      body: "Your mentor account has been created by your agency admin.",
      password: plainPassword,
    });

    //Success
    return res.status(201).json({
      message: "Mentor created successfully",
      mentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting admission officers from the agent
export const getAllAdmissionOfficer = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    // Getting all the admission officers
    const admissionOfficer = await Agent.find({
      agency: userId,
      systemRole: "admission_officer",
      isVerified: true,
      isActive: true,
    });
    // Success message
    return res
      .status(200)
      .json({ message: "Success", officers: admissionOfficer });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper function to create auto message
async function createAutoMessage(agentId, studentId, agentName) {
  try {
    const participants = [
      { user: agentId, model: "Agent" },
      { user: studentId, model: "Student" },
    ];

    const participantsHash = [agentId.toString(), studentId.toString()]
      .sort()
      .join("_");

    // Check if conversation already exists
    let conversation = await Conversation.findOne({ participantsHash });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants,
        participantsHash,
      });
    }

    // Create welcome message
    const welcomeContent = `Hello, I'm ${agentName}, your assigned agent. I'm here to guide you through your application process. If you have any queries or need assistance, feel free to reach out anytime. Looking forward to working with you!`;

    const message = await Message.create({
      conversationId: conversation._id,
      sender: agentId,
      senderModel: "Agent",
      receiver: studentId,
      receiverModel: "Student",
      content: welcomeContent,
      status: "sent",
    });

    // Update conversation with last message
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    console.log(
      `Welcome message sent to student ${studentId} from agent ${agentId}`,
    );
    // sending the message notification to the student
    await sendStudentMessageuPushNotification({
      studentId: studentId,
      triggerId: agentId,
      title: `New message from ${agentName}`,
      body:
        message.content.length > 60
          ? message.content.slice(0, 60) + "..."
          : message.content,
    });
  } catch (error) {
    console.error("Error creating welcome message:", error);
    // Don't throw - we don't want to break agent assignment if messaging fails
  }
}

