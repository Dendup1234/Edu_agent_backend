import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js";

export const createRequiredDocument = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { name, description, stage } = req.body;

    if (!name || !description || !stage) {
      return res.status(400).json({ message: "missing required field" });
    }

    const exists = await RequiredDocument.findOne({ name, agency, stage });
    if (exists) {
      return res.status(409).json({ message: "Document already exists" });
    }

    const requiredDocument = await RequiredDocument.create({
      name,
      description,
      stage,
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

export const updateRequiredDocumentsList = async(req, res) => {
  try {
    const agency = req.user.agencyId;
    const { Id } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "missing required field" });
    }

    const update = {name, description};

    const requiredDocument = await RequiredDocument.findByIdAndUpdate(
      { _id: Id, agency },
      update,
      { new: true, runValidators: true }
    )

    return res.status(201).json({
      message: "Updated successfully",
      data: requiredDocument,
    });
  } catch (err) {
    console.error("updateRequiredDocument:", err);
    return res.status(500).json({ message: err.message });
  }
}

export const getRequiredAdmissionDocumentsList = async (req, res) => {
  try {
    const agency = req.user.agencyId;

    const documentTypes = await RequiredDocument.find({ agency, stage:"admission" })
      .select("name description")
      .lean();

    return res.status(200).json({ data: documentTypes });
  } catch (err) {
    console.error("getRequiredDocuments:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getRequiredVisaDocumentsList = async (req, res) => {
  try {
    const agency = req.user.agencyId;

    const documentTypes = await RequiredDocument.find({ agency, stage:"visa" })
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
    const { reviewComment } = req.body;
    const agentId = req.user.id;
    const agency = req.user.agencyId;

    if (!ALLOWED_STATUSES.includes(reviewStatus)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const update = { reviewStatus, reviewComment };

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