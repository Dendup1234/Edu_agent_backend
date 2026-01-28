import Document from "../../models/document.js";
import DocumentType from "../../models/requiredDocument.js";

export const getDocumentName = async (req, res) => {
  try {
    const { agencyId } = req.params;

    if(!agencyId){
      return res.status(400).json({ message: "agency ID required"})
    }
    const documentTypes = await DocumentType.find({
      agency: agencyId
    }).select("name description")

    return res.status(200).json(documentTypes)
  }
  catch(err) {
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
}

export const getDocumentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId){
      return res.status(400).json({message: "student ID required"})
    }
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