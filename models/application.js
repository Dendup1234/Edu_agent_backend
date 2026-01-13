import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    applicationFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },

    status: {
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

    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],

    submittedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Application", ApplicationSchema);
