import Application from "../../models/application.js";

export const getApplicationStatus = async (req, res) => {
  try {
    const studentId = req.user.sub; 

    if (!studentId) {
      return res.status(400).json({ message: "student ID required" });
    }

    const application = await Application.findOne({
      applicationFor: studentId,
    }).select("stages status").lean();

    if (!application) {
      return res.status(200).json({ data: null });
    }

    return res.status(200).json({ data: application });
  } catch (err) {
    console.error("getApplicationStatus:", err);
    return res.status(500).json({ message: err.message });
  }
};
