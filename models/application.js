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
        "draft",
        "submitted",
        "university_review",
        "offer_received",
        "offer_accepted",
        "visa_applied",
        "visa_approved",
        "enrolled",
        "rejected",
        "withdrawn",
      ],
      default: "draft"
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
