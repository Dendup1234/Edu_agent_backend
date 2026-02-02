import Document from "../../models/document.js";

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