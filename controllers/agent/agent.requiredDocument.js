import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js";
import StudentRequiredDocument from "../../models/studentRequiredDocument.js";

export const createRequiredDocument = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { name, description, stage } = req.body;

    if (!name || !description || !stage) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await RequiredDocument.findOne({ name, agency, stage });
    if (exists) {
      return res.status(409).json({ message: "Required document already exists for this agency and stage" });
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

export const updateRequiredDocument = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && !description) {
      return res.status(400).json({ message: "Provide at least one field to update" });
    }

    const update = {};
    if (name) update.name = name;
    if (description) update.description = description;

    // findOneAndUpdate so we can filter by both _id AND agency
    const requiredDocument = await RequiredDocument.findOneAndUpdate(
      { _id: id, agency },
      update,
      { new: true, runValidators: true }
    );

    if (!requiredDocument) {
      return res.status(404).json({ message: "Required document not found" });
    }

    return res.status(200).json({
      message: "Updated successfully",
      data: requiredDocument,
    });
  } catch (err) {
    console.error("updateRequiredDocument:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Single endpoint — stage passed as query param: ?stage=admission | ?stage=visa
export const getRequiredDocumentsList = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { stage } = req.query;

    if (stage && !["admission", "visa"].includes(stage)) {
      return res.status(400).json({ message: "Invalid stage. Use 'admission' or 'visa'" });
    }

    const filter = { agency };
    if (stage) filter.stage = stage;

    const documents = await RequiredDocument.find(filter)
      .select("name description stage")
      .lean();

    return res.status(200).json({ data: documents });
  } catch (err) {
    console.error("getRequiredDocumentsList:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getDocumentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const agency = req.user.agencyId;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
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

// Update the review status on StudentRequiredDocument (not Document)
export const updateDocumentReviewStatus = async (req, res) => {
  try {
    const { studentRequiredDocumentId } = req.params;
    const { status, reviewComment } = req.body;
    const agentId = req.user.id;
    const agency = req.user.agencyId;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid or missing status. Allowed: under_review, approved, reupload, rejected" });
    }

    // Verify the StudentRequiredDocument belongs to this agency via its student's linked Document
    const srd = await StudentRequiredDocument.findById(studentRequiredDocumentId)
      .populate("document", "agency")
      .lean();

    if (!srd) {
      return res.status(404).json({ message: "Student required document not found" });
    }

    if (!srd.document || String(srd.document.agency) !== String(agency)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const update = { status };
    if (reviewComment) update.reviewComment = reviewComment;
    if (status === "approved") update.verifiedBy = agentId;

    const updated = await StudentRequiredDocument.findByIdAndUpdate(
      studentRequiredDocumentId,
      update,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Review status updated",
      data: updated,
    });
  } catch (err) {
    console.error("updateDocumentReviewStatus:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Get the full checklist for a student, optionally filtered by stage
export const getStudentChecklist = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { stage } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (stage && !["admission", "visa"].includes(stage)) {
      return res.status(400).json({ message: "Invalid stage. Use 'admission' or 'visa'" });
    }

    const filter = { student: studentId };
    if (stage) filter.stage = stage;

    const checklist = await StudentRequiredDocument.find(filter)
      .populate("requiredDocument", "name description stage")
      .populate("document", "fileName fileType fileURL fileSize")
      .lean();

    return res.status(200).json({ data: checklist });
  } catch (err) {
    console.error("getStudentChecklist:", err);
    return res.status(500).json({ message: err.message });
  }
};