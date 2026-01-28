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

const ALLOWED_STAGE_STATUSES = ["in_progress", "completed"];

export const updateStageStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { stageName, status } = req.body;
    const agency = req.user.agencyId;

    if (!stageName || !status) {
      return res.status(400).json({
        message: "stageName and status are required",
      });
    }

    if (!ALLOWED_STAGE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid stage status" });
    }

    const application = await Application.findOne({
      applicationFor: studentId,
      agency,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const stage = application.stages.find(
      (s) => s.name === stageName
    );

    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }

    stage.status = status;

    await application.save();

    return res.status(200).json({
      message: "Stage updated successfully",
      data: application,
    });
  } catch (err) {
    console.error("updateStageStatus:", err);
    return res.status(500).json({ message: err.message });
  }
};

