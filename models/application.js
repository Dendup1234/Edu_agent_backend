import mongoose from "mongoose";

const ApplicationSchema = new Schema(
  {
    university: {
      type: Types.ObjectId,
      ref: "University",
      required: true
    },

    course: {
      type: Types.ObjectId,
      ref: "Course"
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

    visaCountry: {
      type: String,
      trim: true
    },

    visaStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "pending"
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
