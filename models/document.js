import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // Polymorphic uploader (Student or Agent)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "uploaderModel",
      required: true,
    },
    uploaderModel: {
      type: String,
      enum: ["Student", "Agent"],
      required: true,
    },

    // The student this document belongs to (always)
    belongsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
    },

    // ONLY for student uploads
    requiredDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequiredDocument",
      default: null,
    },

    // ONLY for agent uploads
    documentCategory: {
      type: String,
      enum: ["offer_letter", "COE", "other"],
      default: null,
    },

    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileURL: { type: String, required: true },

    // ONLY for student uploads
    reviewStatus: {
      type: String,
      enum: ["under_review", "approved", "reupload", "rejected"],
      default: "under_review",
    },

    // Agent who reviewed student-uploaded docs
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },

    isResubmitted: { type: Boolean, default: false },

    // Optional note (mostly useful for agent uploads)
    description: { type: String },
  },
  { timestamps: true }
);

documentSchema.pre("validate", async function () {
  // STUDENT uploads
  if (this.uploaderModel === "Student") {
    if (!this.requiredDocument) {
      throw new Error(
        "Student uploads must reference a RequiredDocument"
      );
    }

    // Student docs should NOT define agent-only fields
    this.documentCategory = null;
  }

  // AGENT uploads
  if (this.uploaderModel === "Agent") {
    if (this.requiredDocument) {
      throw new Error(
        "Agent uploads cannot reference RequiredDocument"
      );
    }

    if (!this.documentCategory) {
      throw new Error(
        "Agent uploads must have a documentCategory"
      );
    }

    // Agent docs are not reviewed
    this.reviewStatus = null;
    this.reviewedBy = null;
    this.isResubmitted = false;
  }
});

export default mongoose.model("Document", documentSchema);
