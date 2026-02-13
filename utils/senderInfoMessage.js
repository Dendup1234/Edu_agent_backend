import Agent from "../models/agent.js";
import Agency from "../models/agency.js";
import Mentor from "../models/mentor.js";
import Student from "../models/student.js";

export const getSenderDisplayInfo = async (userId, model) => {
  let user;

  switch (model) {
    case "Agent":
      user = await Agent.findById(userId).select("name").lean();
      break;

    case "Agency":
      user = await Agency.findById(userId).select("name").lean();
      break;

    case "Mentor":
      user = await Mentor.findById(userId).select("name").lean();
      break;

    case "Student":
      user = await Student.findById(userId).select("name").lean();
      break;

    default:
      return { name: "Someone", model };
  }

  return {
    name: user?.name || "Someone",
    model,
  };
};
