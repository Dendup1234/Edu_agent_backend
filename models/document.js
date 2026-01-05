import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
    },
    documentType: {
      type: String,
      required: true,
    },
    
    filename: String,
    fileType: String,
    fileSize: Number,
    fileKey: String,
    fileURL: String,

    uploadedAt: {
    type: Date,
    default: Date.now
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_revision"],
      default: "pending",
    },
    reviewStatus: {
      verified: { type: Boolean, default: false },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
      verifiedAt: Date,
    },
    isResubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
