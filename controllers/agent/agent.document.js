import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js";
import Student from "../../models/student.js";

export const createRequiredDocument = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const exists = await RequiredDocument.findOne({ name, agency });
    if (exists) {
      return res.status(409).json({ message: "Document already exists" });
    }

    const requiredDocument = await RequiredDocument.create({
      name,
      description,
      agency,
    });

    return res.status(201).json({
      message: "Created successfully",
      data: requiredDocument,
    });
  } catch (err) {
    console.error("createRequiredDocument:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getRequiredDocumentsList = async (req, res) => {
  try {
    const agency = req.user.agencyId;

    const documentTypes = await RequiredDocument.find({ agency })
      .select("name description")
      .lean();

    return res.status(200).json({ data: documentTypes });
  } catch (err) {
    console.error("getRequiredDocuments:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getDocumentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const agency = req.user.agencyId;

    if (!studentId) {
      return res.status(400).json({ message: "student ID required" });
    }

    const documents = await Document.find({
      belongsTo: studentId,
      agency,
    }).lean();

    return res.status(200).json({ data: documents });
  } catch (err) {
    console.error("getDocumentsByStudent:", err);
    return res.status(500).json({ message: err.message });
  }
};

const ALLOWED_STATUSES = ["under_review", "approved", "reupload", "rejected"];

export const updateDocumentReviewStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reviewStatus } = req.body;
    const agentId = req.user.id;
    const agency = req.user.agencyId;

    if (!ALLOWED_STATUSES.includes(reviewStatus)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const update = { reviewStatus };

    if (reviewStatus === "approved") {
      update.verifiedBy = agentId;
    }

    const document = await Document.findOneAndUpdate(
      { _id: documentId, agency },
      update,
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.status(200).json({
      message: "Update successful",
      data: document,
    });
  } catch (err) {
    console.error("updateDocumentReviewStatus:", err);
    return res.status(500).json({ message: err.message });
  }
};