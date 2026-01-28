import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js"

export const createRequiredDocument = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const requiredDocument = await RequiredDocument.create({
      name,
      description,
      agency
    });

    return res.status(201).json({
      message: "Created successfully",
      data: requiredDocument
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


export const getDocumentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId){
      return res.status(400).json({message: "student ID required"})
    }
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
    const { documentId } = req.params;
    const { reviewStatus } = req.body;
    const agentId = req.user.id; 

    if (!ALLOWED_STATUSES.includes(reviewStatus)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const document = await Document.findByIdAndUpdate(
      documentId,
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