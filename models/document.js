import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },

    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
    },

    documentName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequiredDocument"
    },

    fileName: String,
    fileType: String,
    fileSize: Number,
    fileURL: String,

    reviewStatus: {
      type: String,
      enum: ["under_review", "approved", "needs_revision"],
      default: "under_review",
    },

    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Agent" 
    },

    isResubmitted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
