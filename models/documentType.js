import mongoose from "mongoose";

const documentTypeSchema = new mongoose.Schema(
  {
    type: { type: String },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency"
    }
  },
  { timestamps: true }
);

export default mongoose.model("DocumentType", documentTypeSchema);
