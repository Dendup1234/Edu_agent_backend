import StudentRequiredDocument from "../../models/studentRequiredDocument.js";
import Document from "../../models/document.js";
// Getting the document context
export const getDocumentFraudContext = async (req, res) => {
  try {
    const { studentRequiredDocumentId } = req.params;

    const item = await StudentRequiredDocument.findById(
      studentRequiredDocumentId,
    )
      .populate(
        "student",
        "name email nationality dob preferredCountry education selectedUniversity selectedCourse",
      )
      .populate("requiredDocument", "name description stage")
      .populate(
        "document",
        "fileName fileType fileSize fileURL documentAnalysis",
      )
      .populate("student.selectedUniversity", "name country")
      .populate("student.selectedCourse", "name level");

    if (!item) {
      return res.status(404).json({
        message: "Student required document not found",
      });
    }

    return res.status(200).json({
      studentRequiredDocumentId: item._id,

      student: {
        id: item.student?._id,
        fullName: item.student?.name || "",
        email: item.student?.email || "",
        nationality: item.student?.nationality || "",
        dob: item.student?.dob || null,
        preferredCountry: item.student?.preferredCountry || "",
        education: item.student?.education || [],
        selectedUniversity: item.student?.selectedUniversity || null,
        selectedCourse: item.student?.selectedCourse || null,
      },

      requiredDocument: {
        id: item.requiredDocument?._id,
        name: item.requiredDocument?.name || "",
        description: item.requiredDocument?.description || "",
        stage: item.requiredDocument?.stage || item.stage,
      },

      document: {
        id: item.document?._id,
        fileName: item.document?.fileName || "",
        fileType: item.document?.fileType || "",
        fileSize: item.document?.fileSize || 0,
        fileURL: item.document?.fileURL || "",
      },

      currentStatus: item.status,
      stage: item.stage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//updating the fraud result
export const updateDocumentFraudResult = async (req, res) => {
  try {
    const { studentRequiredDocumentId } = req.params;

    const {
      expectedDocumentType,
      detectedDocumentType,
      documentMatchesRequirement,
      fraudPercentage,
      riskLevel,
      reasons,
      recommendedAction,
      rawResult,
    } = req.body;

    const item = await StudentRequiredDocument.findById(
      studentRequiredDocumentId,
    );

    if (!item || !item.document) {
      return res.status(404).json({
        message: "Student required document or linked document not found",
      });
    }

    await Document.findByIdAndUpdate(item.document, {
      "documentAnalysis.status": "completed",
      "documentAnalysis.expectedDocumentType": expectedDocumentType,
      "documentAnalysis.detectedDocumentType": detectedDocumentType,
      "documentAnalysis.documentMatchesRequirement": documentMatchesRequirement,
      "documentAnalysis.fraudPercentage": fraudPercentage,
      "documentAnalysis.riskLevel": riskLevel,
      "documentAnalysis.reasons": reasons,
      "documentAnalysis.recommendedAction": recommendedAction,
      "documentAnalysis.checkedAt": new Date(),
      "documentAnalysis.rawResult": rawResult,
    });

    let newStatus = "under_review";

    if (recommendedAction === "reupload") {
      newStatus = "reupload";
    }

    if (recommendedAction === "reject") {
      newStatus = "rejected";
    }

    await StudentRequiredDocument.findByIdAndUpdate(studentRequiredDocumentId, {
      status: newStatus,
      reviewComment: reasons?.join(", ") || "AI fraud check completed",
    });

    return res.status(200).json({
      message: "Fraud result updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
