import RequiredDocument from "../../models/requiredDocument.js";
import StudentRequiredDocument from "../../models/studentRequiredDocument.js";

// Seeds all admission-stage checklist items automatically
export const seedAdmissionChecklist = async (studentId, agencyId) => {
  const templates = await RequiredDocument.find({
    agency: agencyId,
    stage: "admission",
  }).lean();

  if (templates.length === 0) return;

  const checklist = templates.map((template) => ({
    student: studentId,
    requiredDocument: template._id,
    stage: "admission",
    status: "under_review",
    document: null,
  }));

  await StudentRequiredDocument.insertMany(checklist, { ordered: false });
};

// AGENT bulk-creates visa checklist items
// from selected RequiredDocument IDs

export const createStudentChecklist = async (req, res) => {
  try {
    const agency = req.user.agencyId;
    const { studentId } = req.params;
    const { requiredDocumentIds } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!Array.isArray(requiredDocumentIds) || requiredDocumentIds.length === 0) {
      return res.status(400).json({ message: "requiredDocumentIds array is required and cannot be empty" });
    }

    // Verify all selected IDs belong to this agency
    const templates = await RequiredDocument.find({
      _id: { $in: requiredDocumentIds },
      agency,
    }).lean();

    // If some IDs didn't match, something is off
    if (templates.length !== requiredDocumentIds.length) {
      return res.status(400).json({ message: "One or more requiredDocumentIds are invalid or don't belong to this agency" });
    }

    // Check which ones already exist for this student
    const existing = await StudentRequiredDocument.find({
      student: studentId,
      requiredDocument: { $in: requiredDocumentIds },
    })
      .select("requiredDocument")
      .lean();

    const existingIds = new Set(existing.map((doc) => doc.requiredDocument.toString()));

    // Filter out already-existing ones
    const newTemplates = templates.filter((t) => !existingIds.has(t._id.toString()));

    if (newTemplates.length === 0) {
      return res.status(409).json({ message: "All selected documents already exist in this student's checklist" });
    }

    const checklist = newTemplates.map((template) => ({
      student: studentId,
      agency,
      requiredDocument: template._id,
      stage: template.stage,
      status: "under_review",
      document: null,
    }));

    const created = await StudentRequiredDocument.insertMany(checklist);

    // Let the agent know if some were skipped
    const skippedCount = requiredDocumentIds.length - created.length;

    return res.status(201).json({
      message: skippedCount > 0
        ? `Created ${created.length} items. ${skippedCount} already existed and were skipped.`
        : `Created ${created.length} items successfully`,
      data: created,
    });
  } catch (err) {
    console.error("createStudentChecklist:", err);
    return res.status(500).json({ message: err.message });
  }
};