import Agent from "../../models/agent.js";

//admission officers
export const getAllStudent = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    //finding the student for related agent
    const student = await Agent.findById(userId).select("_id").populate({
      path: "assignedStudents",
      select: "name email phone",
    });
    return res.status(200).json({
      message: "Success",
      student: student,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
