import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency"
    },
    documentType: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number 
    },
    fileType: {
      type: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_revision"],
      default: "pending"
    },
    reviewStatus: {
      verified: { type: Boolean, default: false },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
      verifiedAt: Date 
    },
    isResubmitted: { type: Boolean, default: false }

  },
  { timestamps: true }
);