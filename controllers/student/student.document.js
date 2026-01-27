import Document from "../../models/document.js";

export const getDocumentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const documents = await Document.find({
      uploadedBy: studentId
    }).select("reviewStatus");
    return res.status(200).json(documents);
  } 
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};