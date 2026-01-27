import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();
import Agency from "../../models/agency.js";
import University from "../../models/university.js";
import Event from "../../models/event.js";

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
    const { blobName, universityId, eventId, imageType } = req.body;
    const agencyId = req.user.agencyId;

    if (!blobName) {
      return res
        .status(400)
        .json({ error: "Missing blobName or originalName" });
    }

    const blobClient = containerClient.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
      return res.status(400).json({ error: "Upload not found" });
    }

    if (imageType == "agency") {
      const agency = await Agency.findByIdAndUpdate(
        agencyId,
        { logo: blobClient.url },
        { new: true },
      );
      res.json({ message: "Upload confuirmed" });
    }

    if (imageType == "university") {
      const university = await University.findByIdAndUpdate(
        universityId,
        { logo: blobClient.url },
        { new: true },
      );
      res.json({ message: "Upload confuirmed" });
    }

    if (imageType == "event") {
      const event = await Event.findByIdAndUpdate(
        eventId,
        { bannerImageUrl: blobClient.url },
        { new: true },
      );
      res.json({ message: "Upload confuirmed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Confirmation failed" });
  }
};
