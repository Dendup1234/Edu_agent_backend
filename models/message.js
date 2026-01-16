import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId
    },

    senderModel: {
      type: String,
      enum: ["Student", "Mentor", "Agent", "Agency"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
    },

    receiverModel: {
      type: String,
      enum: ["Student", "Mentor", "Agent", "Agency"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receiverModel",
    },

    content: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
