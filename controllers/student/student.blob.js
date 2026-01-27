import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import Student from "../../models/student.js";
import Document from "../../models/document.js";
import Application from "../../models/application.js";

import {
  StorageSharedKeyCredential,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";

dotenv.config();

const {
  AZURE_STORAGE_ACCOUNT_NAME: accountName,
  AZURE_STORAGE_ACCOUNT_KEY: accountKey,
  AZURE_CONTAINER_NAME: containerName
} = process.env;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const containerClient = blobServiceClient.getContainerClient(containerName);

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf"
];

const MAX_SIZE = 50 * 1024 * 1024; 

const REQUIRED_DOC_TYPES = [
  'passport',
  'academic_results',
  'english_test',
  'cv',
  'sop',
  'bank_statement'
];

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
      "application/pdf": "pdf"
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
        expiresOn
      },
      sharedKeyCredential
    ).toString();

    const blobClient = containerClient.getBlockBlobClient(blobName);

    res.json({
      sasUrl: `${blobClient.url}?${sasToken}`,
      blobName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SAS generation failed" });
  }
};

export const confirmUpload = async (req, res) => {
  try {
    const {
      blobName,
      agencyId,
      mimeType,
      size,
      documentType
    } = req.body;

    const studentId = req.user.sub;

    if (!blobName || !mimeType || !size) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blobClient = containerClient.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found" });
    }

    if (documentType === "profile") {
      const student = await Student.findByIdAndUpdate(
        studentId,
        { profileURL: blobClient.url },
        { new: true }
      );

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json({ message: "Profile picture uploaded" });
    }

    if (!REQUIRED_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const document = await Document.create({
      uploadedBy: studentId,
      agency: agencyId,
      documentType,
      fileName: blobName,
      fileType: mimeType,
      fileSize: size,
      fileURL: blobClient.url
    });

    const student = await Student.findById(studentId).select("isEligible");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const approvedDocs = await Document.find({
      uploadedBy: studentId,
      documentType: { $in: REQUIRED_DOC_TYPES },
      reviewStatus: "approved"
    }).select("documentType _id");

    const approvedTypes = approvedDocs.map(d => d.documentType);
    const allApproved = REQUIRED_DOC_TYPES.every(type =>
      approvedTypes.includes(type)
    );

    if (allApproved && student.isEligible) {
      const application = await Application.findOneAndUpdate(
        { applicationFor: studentId },
        {
          $set: { status: "document_review" },
          $addToSet: {
            documents: { $each: approvedDocs.map(d => d._id) }
          }
        },
        { new: true, upsert: true }
      );

      return res.json({
        message: "All documents approved. Application started.",
        status: application.status
      });
    }

    return res.json({ message: "Upload confirmed" });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Confirmation failed" });
  }
};
