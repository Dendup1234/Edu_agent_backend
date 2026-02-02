import mongoose from "mongoose";

const requiredDocumentListSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    stage: {
      type: String,
      enum: ["admission", "visa"],
      required: true,
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency"
    }
  },
  { timestamps: true }
);

export default mongoose.model("RequiredDocument", requiredDocumentListSchema);
