import Application from "../../models/application.js";

export const getStudentApplication = async (req, res) => {
  try {
    const { studentId } = req.params;
    const agency = req.user.agencyId;

    const application = await Application.findOne({
      applicationFor: studentId,
      agency,
    }).lean();

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.status(200).json({ data: application });
  } catch (err) {
    console.error("getStudentApplication:", err);
    return res.status(500).json({ message: err.message });
  }
};
