import dotenv from "dotenv";
// import { v4 as uuidv4 } from "uuid";
dotenv.config();
import Agency from "../models/agency.js";

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
    const { fileName } = req.body;

    // if (!ALLOWED_TYPES.includes(mimeType)) {
    //   return res.status(400).json({ error: "Invalid file type" });
    // }

    // if (size > MAX_SIZE) {
    //   return res.status(400).json({ error: "File too large" });
    // }

    // const ext = mimeType.split("/")[1] || "bin";
    // const blobName = `${uuidv4()}.${ext}`;

    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("cw"),
        startsOn,
        expiresOn,
        // contentType: mimeType
      },
      blobServiceClient.credential
    ).toString();

    const blobClient = containerClient.getBlockBlobClient(fileName);

    res.json({
      sasUrl: `${blobClient.url}?${sasToken}`,
      // blobName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SAS generation failed" });
  }
};

export const confirmUpload = async (req, res) => {
  try {
    const { blobName, originalName, applicationId, leadId, universityId, courseId, agencyId } = req.body;

    // Validate required info
    if (!blobName || !originalName) {
      return res.status(400).json({ error: "Missing blobName or originalName" });
    }

    if (!applicationId && (!leadId || !universityId)) {
      return res.status(400).json({ error: "Missing leadId or universityId to create application" });
    }

    const blobClient = containerClient.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found" });
    }

    const props = await blobClient.getProperties();

    // Save profile url in agency
    const agency = await Agency.findByIdAndUpdate(
      agencyId,
      { logo: blobClient.url },
      { new: true }
    );

    // Create the document
    // const document = await Document.create({
    //   fileName: blobName,
    //   fileType: props.contentType,
    //   fileSize: props.contentLength,
    //   fileURL: blobClient.url
    // });

    // let application;

    // if (applicationId) {
    //   // Attach to existing application
    //   application = await Application.findByIdAndUpdate(
    //     applicationId,
    //     { $push: { documents: document._id } },
    //     { new: true }
    //   );

    //   if (!application) {
    //     return res.status(404).json({ error: "Application not found" });
    //   }
    // } else {
    //   // Create new application and attach document
    //   application = await Application.create({
    //     lead: leadId,
    //     university: universityId,
    //     course: courseId || null,
    //     documents: [document._id],
    //     status: "draft"
    //   });
    // }

    // Respond with application info
    res.json({
      message: "Upload",
      success: true,
      // applicationId: application._id,
      // applicationStatus: application.status,
      // visaStatus: application.visaStatus,
      // documents: application.documents
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Confirmation failed" });
  }
};