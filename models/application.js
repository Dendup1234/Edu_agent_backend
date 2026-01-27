import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    applicationFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },

    stage: {
      type: String,
      enum: [
        "document_review",
        "documents_requested",
        "offer_letter_sent",
        "offer_rejected",
        "COE_received",
        "visa_applied",
        "visa_refused",
        "visa_approved",
        "withdrawn"
      ],
      default: "document_review"
    },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress"
    },

    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Application", ApplicationSchema);
