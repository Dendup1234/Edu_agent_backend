import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
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

    belongsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileURL: { type: String, required: true },

    // ONLY for agent uploads
    documentCategory: {
      type: String,
      enum: ["offer_letter", "COE", "other"],
      default: null,
    },

    isResubmitted: {
      type: Boolean,
      default: false,
    },

    documentAnalysis: {
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        index: true,
      },

      expectedDocumentType: {
        type: String,
        default: null,
      },

      detectedDocumentType: {
        type: String,
        default: null,
      },

      documentMatchesRequirement: {
        type: Boolean,
        default: null,
      },

      fraudPercentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },

      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: null,
      },

      reasons: [String],

      recommendedAction: {
        type: String,
        enum: ["approve", "under_review", "reupload", "reject"],
        default: "under_review",
      },

      checkedBy: {
        type: String,
        default: "n8n-ai-workflow",
      },

      checkedAt: {
        type: Date,
        default: null,
      },

      rawResult: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Document", documentSchema);
