import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();
import Mentor from "../../models/mentor.js"

import {
  StorageSharedKeyCredential,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_CONTAINER_NAME;
const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey,
);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential,
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
        contentType: mimeType,
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

export const confirmUpload = async (req, res) => {
  try {
    const { blobName, imageType } = req.body;
    const mentorId = req.user.id;

    if (!blobName || !imageType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (imageType !== "profile") {
      return res.status(400).json({ error: "Invalid image type" });
    }

    const blobClient = containerClient.getBlobClient(blobName);

    const exists = await blobClient.exists();
    if (!exists) {
      return res.status(400).json({ error: "Upload not found" });
    }

    const mentor = await Mentor.findByIdAndUpdate(
      mentorId,
      { profileUrl: blobClient.url },
      { new: true }
    );

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    return res.status(200).json({
      message: "Upload confirmed",
      profileUrl: blobClient.url,
    });

  } catch (err) {
    console.error("confirmUpload error:", err);
    return res.status(500).json({ error: "Confirmation failed" });
  }
};

