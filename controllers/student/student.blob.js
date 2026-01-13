import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();
import Student from "../../models/student.js";
import Document from "../../models/document.js";
import Application from "../../models/application.js"

import {
  StorageSharedKeyCredential,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";


const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_CONTAINER_NAME;
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const containerClient = blobServiceClient.getContainerClient(containerName);

const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_SIZE = 50 * 1024 * 1024; 

export const generateSAS = async (req, res) => {
  try {
    const { mimeType, size } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    if (size > MAX_SIZE) {
      return res.status(400).json({ error: "File too large" });
    }

    const ext = mimeType.split("/")[1] || "bin";
    const blobName = `${uuidv4()}.${ext}`;

    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("cw"),
        startsOn,
        expiresOn,
        contentType: mimeType
      },
      blobServiceClient.credential
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
    const { blobName, agencyId, mimeType, size, documentType } = req.body;
    const studentId = req.user.sub;

    if (!blobName || !studentId || !mimeType || !size) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blobClient = containerClient.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found" });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { profileURL: blobClient.url },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (agencyId) {
      const document = await Document.create({
        uploadBy: studentId,
        agency: agencyId,
        documentType: documentType,
        fileName: blobName,
        fileType: mimeType,
        fileSize: size,
        fileURL: blobClient.url
      });

      const application = await Application.create({
        applicationFor: studentId,
        documents: [document._id],
        status: "document_review"
      });

      return res.json({
        message: "Upload confirmed",
        status: application.status
      });
    }

    return res.json({
      message: "Upload confirmed",
      fileURL: blobClient.url
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Confirmation failed" });
  }
};
