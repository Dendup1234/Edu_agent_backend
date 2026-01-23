import Application from "../../models/application.js";

export const getStudentApplication = async(req, res) => {
    try {
        const { studentId } = req.params;
        const application = await Application.find({
            applicationFor: studentId
        })
        return res.status(200).json(application)
    }
    catch(err){
        console.error(err)
        return res.status(500).json({ message: err.message });
    }
}

const ALLOWED_STATUSES = [
    "document_review",
    "documents_requested",
    "offer_letter_sent",
    "offer_rejected",
    "COE_received",
    "visa_applied",
    "visa_refused",
    "visa_approved",
    "withdrawn"
];

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      {
        status
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.status(200).json(application);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};