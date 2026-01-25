import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'model'
    },
    model: {
      type: String,
      enum: ['Student', 'Agency', 'Mentor', 'Agent']
    }
  }],

  participantsHash: { type: String, unique: true },

  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);
