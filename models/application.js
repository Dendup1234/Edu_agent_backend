import mongoose from "mongoose";

const StageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: [
        "document_review",
        "offer_letter_received",
        "no_offer_letter",
        "coe_received",
        "visa_applied",
        "visa_refused",
        "visa_approved",
        "withdrawn"
      ],
      required: true
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress"
    }
  },
  { _id: false }
);

const ApplicationSchema = new mongoose.Schema(
  {
    applicationFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    stages: {
      type: [StageSchema],
      default: [
        { name: "document_review" },
        { name: "offer_letter_received" },
        { name: "no_offer_letter" },
        { name: "coe_received" },
        { name: "visa_applied" },
        { name: "visa_refused" },
        { name: "visa_approved" },
        { name: "withdrawn" }
      ]
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
