import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import Student from "../../models/student.js";
import Document from "../../models/document.js";

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

// GENERATE SAS (AGENT)

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

// CONFIRM UPLOAD (AGENT)

export const confirmUpload = async (req, res) => {
  try {
    const {
      blobName,
      mimeType,
      size,
      studentId,
      agencyId,
      documentCategory, // offer_letter | COE | other
      description
    } = req.body;

    const agentId = req.user.sub;

    if (
      !blobName ||
      !mimeType ||
      !size ||
      !studentId ||
      !agencyId ||
      !documentCategory
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blobClient = containerClient.getBlobClient(blobName);
    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found" });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const documentData = {
      uploadedBy: agentId,
      uploaderModel: "Agent",
      belongsTo: studentId,
      agency: agencyId,

      requiredDocument: null,
      documentCategory,

      fileName: blobName,
      fileType: mimeType,
      fileSize: size,
      fileURL: blobClient.url,

      description
    };

    const savedDoc = await Document.create(documentData);

    return res.json({
      message: "Document uploaded successfully",
      document: savedDoc
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Confirmation failed" });
  }
};
