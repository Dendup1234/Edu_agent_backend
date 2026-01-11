import mongoose from "mongoose";
import student from "./student";

const ApplicationSchema = new Schema(
  {
    applicationFor: {
      type: Types.ObjectId,
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
        type: Types.ObjectId,
        ref: "Document",
      },
    ],

    submittedAt: Date
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", ApplicationSchema);
