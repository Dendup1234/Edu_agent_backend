import Document from "../models/document.js";
import dotenv from "dotenv";

dotenv.config();

export const triggerFraudCheckWorkflow = async ({
  documentId,
  studentRequiredDocumentId,
}) => {
  try {
    if (!process.env.N8N_FRAUD_DETECTION_WEBHOOK_URL) {
      throw new Error("N8N webhook URL is missing in .env");
    }

    // Set status to processing
    await Document.findByIdAndUpdate(documentId, {
      "documentAnalysis.status": "processing",
    });

    const response = await fetch(process.env.N8N_FRAUD_DETECTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-n8n-secret": process.env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        documentId,
        studentRequiredDocumentId,
      }),
    });

    // ❗ Important: check if request succeeded
    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json().catch(() => null);

    return data;
  } catch (error) {
    console.error("triggerFraudCheckWorkflow error:", error.message);

    // Update document status to failed
    await Document.findByIdAndUpdate(documentId, {
      "documentAnalysis.status": "failed",
      "documentAnalysis.reasons": ["Failed to trigger fraud workflow"],
    });

    // ❗ Throw error so caller (confirmUpload) knows
    throw error;
  }
};
