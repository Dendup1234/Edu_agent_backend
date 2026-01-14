import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "model",
    }
  ],
  models: ['Student', 'Agency', 'Mentor', 'Agent'],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);
