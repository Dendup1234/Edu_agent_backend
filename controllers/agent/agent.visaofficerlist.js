import Agent from "../../models/agent.js";

export const getVisaAgent = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }
    // finding all the agent inside the organization
    const agent = await Agent.find({
      agency: userId,
      systemRole: "visa_officer",
      isVerified: true,
      isActive: true,
    });
    return res.status(200).json({ message: "Success", agents: agent });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
