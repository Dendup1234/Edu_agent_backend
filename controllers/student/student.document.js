import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js";
import Student from "../../models/student.js";

export const getRequiredDocumentsList = async (req, res) => {
  try {
    const studentId = req.user.sub;

    const student = await Student.findById(studentId).select("registeredAgency");

    if (!student || !student.registeredAgency) {
      return res.status(404).json({ message: "Student or agency not found" });
    }

    const requiredDocument = await RequiredDocument.find({
      agency: student.registeredAgency,
    })
      .select("name description") 
      .lean();

    return res.status(200).json({ data: requiredDocument });
  } catch (err) {
    console.error("getRequiredDocumentsForStudent:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getDocumentStatus = async (req, res) => {
  try {
    const studentId = req.user.sub;

    if (!studentId) {
      return res.status(400).json({ message: "student ID required" });
    }

    const student = await Student.findById(studentId).select("registeredAgency");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.registeredAgency) {
      return res.status(200).json({ data: [] });
    }

    const documents = await Document.find({
      uploadedBy: studentId,
      agency: student.registeredAgency,
    })
    .select("documentName reviewStatus")
    .populate({
      path: "requiredDocument",
      select: "name",
    })
    .lean();

    return res.status(200).json({ data: documents });
  } catch (err) {
    console.error("getDocumentStatus:", err);
    return res.status(500).json({ message: err.message });
  }
};
