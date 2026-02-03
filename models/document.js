import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "uploaderModel",
      required: true,
    },

    uploaderModel: {
      type: String,
      enum: ["Student", "Agent"],
      required: true,
    },

    belongsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileURL: { type: String, required: true },

    // ONLY for agent uploads 
    documentCategory: { 
      type: String, 
      enum: ["offer_letter", "COE", "other"], 
      default: null
    },
    
    isResubmitted: {
      type: Boolean,
      default: false
     }
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
