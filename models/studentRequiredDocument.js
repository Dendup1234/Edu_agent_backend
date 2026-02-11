import mongoose from "mongoose";

const studentRequiredDocumentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    requiredDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequiredDocument",
      required: true,
      index: true,
    },

    // duplicated intentionally for fast queries
    stage: {
      type: String,
      enum: ["admission", "visa"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["under_review", "approved", "reupload", "rejected"],
      default: "under_review",
      index: true,
    },

    reviewComment: {
      type: String
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },

    // current uploaded document
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
  },
  { timestamps: true },
);

// Prevent duplicate checklist items
studentRequiredDocumentSchema.index(
  { student: 1, requiredDocument: 1 },
  { unique: true },
);

export default mongoose.model(
  "StudentRequiredDocument",
  studentRequiredDocumentSchema,
);
