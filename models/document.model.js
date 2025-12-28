import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const documentSchema = new Schema(
  {
    uploadedBy: {
      type: Types.ObjectId,
      ref: "Student",
      required: true,
    },
    agency: {
      type: Types.ObjectId,
      ref: "Agency",
    },
    documentType: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
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
