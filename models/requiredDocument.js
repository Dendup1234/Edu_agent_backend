import mongoose from "mongoose";

const requiredDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    stage: {
      type: String,
      enum: ["admission", "visa"],
      required: true,
      index: true,
    },

    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// One template per agency + stage + name
requiredDocumentSchema.index(
  { agency: 1, stage: 1, name: 1 },
  { unique: true },
);

export default mongoose.model("RequiredDocument", requiredDocumentSchema);
