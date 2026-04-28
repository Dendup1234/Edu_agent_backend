import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import Student from "../../models/student.js";
import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js";
import StudentRequiredDocument from "../../models/studentRequiredDocument.js";
import { triggerFraudCheckWorkflow } from "../../utils/triggerDocumentCheck.js";

import {
  StorageSharedKeyCredential,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

dotenv.config();

// AZURE SETUP
const {
  AZURE_STORAGE_ACCOUNT_NAME: accountName,
  AZURE_STORAGE_ACCOUNT_KEY: accountKey,
  AZURE_CONTAINER_NAME: containerName,
} = process.env;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey,
);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential,
);

const containerClient = blobServiceClient.getContainerClient(containerName);

// UPLOAD CONSTRAINTS
const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const PROFILE_TYPES = ["image/png", "image/jpeg"];

// GENERATE SAS
export const generateSAS = async (req, res) => {
  try {
    const { mimeType, size } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    if (size > MAX_SIZE) {
      return res.status(400).json({ error: "File too large" });
    }

    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "application/pdf": "pdf",
    };

    const blobName = `${uuidv4()}.${extMap[mimeType]}`;

    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        startsOn,
        expiresOn,
      },
      sharedKeyCredential,
    ).toString();

    const blobClient = containerClient.getBlockBlobClient(blobName);

    res.json({
      sasUrl: `${blobClient.url}?${sasToken}`,
      blobName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SAS generation failed" });
  }
};

// CONFIRM UPLOAD (STUDENT)
export const confirmUpload = async (req, res) => {
  try {
    const { blobName, mimeType, size, documentType, requiredDocumentId } =
      req.body;

    const studentId = req.user.sub;

    if (!blobName || !mimeType || !size || !documentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const student =
      await Student.findById(studentId).select("registeredAgency");

    if (!student || !student.registeredAgency) {
      return res.status(404).json({ message: "Student or agency not found" });
    }

    const blobClient = containerClient.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found in storage" });
    }

    // PROFILE UPLOAD
    if (documentType === "profile") {
      if (!PROFILE_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: "Profile must be a png or jpeg" });
      }

      const updated = await Student.findByIdAndUpdate(
        studentId,
        { profileUrl: blobClient.url },
        { new: true },
      );

      return res.json({
        message: "Profile picture uploaded successfully",
        profileUrl: updated.profileUrl,
      });
    }

    // REQUIRED DOCUMENT UPLOAD
    if (!requiredDocumentId) {
      return res.status(400).json({
        error: "requiredDocumentId is required for document uploads",
      });
    }

    const requiredDoc = await RequiredDocument.findOne({
      _id: requiredDocumentId,
      agency: student.registeredAgency,
    });

    if (!requiredDoc) {
      return res.status(404).json({
        error: "Required document not found for this agency",
      });
    }

    const checklist = await StudentRequiredDocument.findOne({
      student: studentId,
      requiredDocument: requiredDocumentId,
    });

    if (!checklist) {
      return res.status(404).json({
        error: "This document is not on your checklist",
      });
    }

    let savedDoc;

    if (!checklist.document) {
      savedDoc = await Document.create({
        uploadedBy: studentId,
        uploaderModel: "Student",
        belongsTo: studentId,
        agency: student.registeredAgency,
        fileName: blobName,
        fileType: mimeType,
        fileSize: size,
        fileURL: blobClient.url,
        documentAnalysis: {
          status: "pending",
        },
      });
    } else if (checklist.status === "reupload") {
      savedDoc = await Document.findByIdAndUpdate(
        checklist.document,
        {
          fileName: blobName,
          fileType: mimeType,
          fileSize: size,
          fileURL: blobClient.url,
          isResubmitted: true,
          documentAnalysis: {
            status: "pending",
            expectedDocumentType: null,
            detectedDocumentType: null,
            documentMatchesRequirement: null,
            fraudPercentage: null,
            riskLevel: null,
            reasons: [],
            recommendedAction: "under_review",
            checkedAt: null,
            rawResult: null,
          },
        },
        { new: true },
      );
    } else {
      return res.status(409).json({
        error:
          "Document already uploaded. Wait for the agent to request a reupload before uploading again",
      });
    }

    if (!savedDoc) {
      return res.status(500).json({
        error: "Document could not be saved",
      });
    }

    const updatedChecklist = await StudentRequiredDocument.findByIdAndUpdate(
      checklist._id,
      {
        document: savedDoc._id,
        status: "under_review",
        reviewComment: "",
      },
      { new: true },
    );

    await Student.findByIdAndUpdate(studentId, {
      status: "converted",
    });

    // IMPORTANT: trigger n8n before success response
    try {
      console.log("Triggering n8n fraud workflow...", {
        documentId: savedDoc._id.toString(),
        studentRequiredDocumentId: updatedChecklist._id.toString(),
      });

      await triggerFraudCheckWorkflow({
        documentId: savedDoc._id.toString(),
        studentRequiredDocumentId: updatedChecklist._id.toString(),
      });

      console.log("n8n fraud workflow triggered successfully");
    } catch (workflowError) {
      console.error("Fraud workflow trigger failed:", {
        message: workflowError.message,
        response: workflowError.response?.data,
        status: workflowError.response?.status,
      });

      await Document.findByIdAndUpdate(savedDoc._id, {
        "documentAnalysis.status": "failed",
        "documentAnalysis.reasons": ["Fraud workflow could not be triggered"],
      });

      return res.status(502).json({
        message: "Document uploaded, but fraud workflow failed to trigger",
        error: workflowError.response?.data || workflowError.message,
        document: savedDoc,
      });
    }

    return res.status(200).json({
      message: "Document uploaded successfully and fraud workflow triggered",
      document: savedDoc,
      checklist: updatedChecklist,
    });
  } catch (error) {
    console.error("confirmUpload:", error);
    return res.status(500).json({
      error: "Confirmation failed",
      details: error.message,
    });
  }
};
