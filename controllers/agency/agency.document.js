import Document from "../../models/document.js";

export const getDocumentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const documents = await Document.find({
      uploadedBy: studentId
    });
    return res.status(200).json(documents);
  } 
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

const ALLOWED_STATUSES = [
  "under_review",
  "approved",
  "needs_revision"
];

export const updateDocumentReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewStatus } = req.body;
    const agentId = req.user.id; 

    if (!ALLOWED_STATUSES.includes(reviewStatus)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const document = await Document.findByIdAndUpdate(
      id,
      {
        reviewStatus,
        verifiedBy: agentId
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.status(200).json(document);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};