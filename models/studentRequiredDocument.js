import mongoose from "mongoose";
import RequiredDocument from "./requiredDocument.js";

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
      default: "pending",
      index: true,
    },

    // current uploaded document
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate checklist items
studentRequiredDocumentSchema.index(
  { student: 1, requiredDocument: 1 },
  { unique: true }
);

// Enforce stage consistency
studentRequiredDocumentSchema.pre("validate", async function () {
  const doc = await RequiredDocument.findById(this.requiredDocument).select(
    "stage"
  );

  if (!doc) throw new Error("Invalid RequiredDocument");

  if (doc.stage !== this.stage) {
    throw new Error("Stage mismatch with RequiredDocument");
  }
});

export default mongoose.model(
  "StudentRequiredDocument",
  studentRequiredDocumentSchema
);
