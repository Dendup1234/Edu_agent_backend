import agency from "../../models/agency.js";
import Agent from "../../models/agent.js";
import Role from "../../models/role.js";
import { generatePassword } from "../../utils/password.js";
import { sendAccountEmail } from "../../utils/sendEmail.js";
import bcrypt from "bcryptjs";

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
              select: "name country logo",
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
      { runValidators: true }
    );
    return res
      .status(200)
      .json({ message: "Agent updated successfully", agent: updatedAgent });
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
