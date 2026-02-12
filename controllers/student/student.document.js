import Document from "../../models/document.js";
import StudentRequiredDocument from "../../models/studentRequiredDocument.js";
import Student from "../../models/student.js";

const getStudentWithAgency = async (studentId) => {
  const student = await Student.findById(studentId).select("registeredAgency");
  if (!student) return { error: "Student not found", status: 404 };
  if (!student.registeredAgency) return { error: "Agency not found", status: 404 };
  return { student };
};

// GET student's checklist with statuses
export const getDocumentStatus = async (req, res) => {
  try {
    const studentId = req.user.sub;
    const { stage } = req.query;

    if (stage && !["admission", "visa"].includes(stage)) {
      return res.status(400).json({ message: "Invalid stage. Use 'admission' or 'visa'" });
    }

    const { error, status } = await getStudentWithAgency(studentId);
    if (error) return res.status(status).json({ message: error });

    const filter = { student: studentId };
    if (stage) filter.stage = stage;

    const checklist = await StudentRequiredDocument.find(filter)
      .populate("requiredDocument", "name description stage")
      .populate("document", "fileName fileType fileURL fileSize")
      .select("status document requiredDocument stage")
      .lean();

    return res.status(200).json({ data: checklist });
  } catch (err) {
    console.error("getDocumentStatus:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET all raw uploaded documents for the student

export const getDocuments = async (req, res) => {
  try {
    const studentId = req.user.sub;

    const { student, error, status } = await getStudentWithAgency(studentId);
    if (error) return res.status(status).json({ message: error });

    const documents = await Document.find({
      belongsTo: studentId,
      agency: student.registeredAgency,
      documentCategory: { $ne: null }
    }).lean();

    return res.status(200).json({ data: documents });
  } catch (err) {
    console.error("getDocuments:", err);
    return res.status(500).json({ message: err.message });
  }
};