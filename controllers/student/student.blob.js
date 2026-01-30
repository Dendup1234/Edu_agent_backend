import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import Student from "../../models/student.js";
import Document from "../../models/document.js";
import RequiredDocument from "../../models/requiredDocument.js";

import {
  StorageSharedKeyCredential,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";

dotenv.config();

// AZURE SETUP

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

// UPLOAD CONSTRAINTS

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf"
];

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

// CONFIRM UPLOAD (STUDENT)

export const confirmUpload = async (req, res) => {
  try {
    const {
      blobName,
      mimeType,
      size,
      agencyId,
      documentType // "profile" OR RequiredDocument.name
    } = req.body;

    const studentId = req.user.sub;

    if (!blobName || !mimeType || !size || !documentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blobClient = containerClient.getBlobClient(blobName);
    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found" });
    }

    // PROFILE EXCEPTION

    if (documentType === "profile") {
      if (!PROFILE_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: "Invalid profile image type" });
      }

      const student = await Student.findByIdAndUpdate(
        studentId,
        { profileUrl: blobClient.url },
        { new: true }
      );

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json({
        message: "Profile picture uploaded successfully",
        profileUrl: student.profileUrl
      });
    }

    // REQUIRED DOCUMENT UPLOAD

    if (!agencyId) {
      return res.status(400).json({ error: "agencyId is required" });
    }

    const requiredDoc = await RequiredDocument.findOne({
      name: documentType,
      agency: agencyId
    });

    if (!requiredDoc) {
      return res.status(404).json({
        error: "Required document not found for this agency"
      });
    }

    const existingDoc = await Document.findOne({
      belongsTo: studentId,
      requiredDocument: requiredDoc._id
    });

    const documentData = {
      uploadedBy: studentId,
      uploaderModel: "Student",
      belongsTo: studentId,
      agency: agencyId,

      requiredDocument: requiredDoc._id,
      documentCategory: null,

      fileName: blobName,
      fileType: mimeType,
      fileSize: size,
      fileURL: blobClient.url,

      reviewStatus: "under_review",
      isResubmitted: Boolean(existingDoc)
    };

    let savedDoc;

    if (existingDoc) {
      savedDoc = await Document.findByIdAndUpdate(
        existingDoc._id,
        documentData,
        { new: true }
      );
    } else {
      savedDoc = await Document.create(documentData);
    }

    return res.json({
      message: "Document uploaded successfully",
      document: savedDoc
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Confirmation failed" });
  }
};
