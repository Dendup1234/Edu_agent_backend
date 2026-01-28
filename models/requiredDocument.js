import mongoose from "mongoose";

const requiredDocumentSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency"
    }
  },
  { timestamps: true }
);

export default mongoose.model("RequiredDocument", requiredDocumentSchema);
