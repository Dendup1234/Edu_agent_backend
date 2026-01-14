import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participants.model'
    },
    model: {
      type: String,
      enum: ['Student', 'Agency', 'Mentor', 'Agent']
    }
  }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);
