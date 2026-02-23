import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participants.model', 
      required: true
    },
    model: {
      type: String,
      enum: ['Student', 'Agency', 'Mentor', 'Agent'],
      required: true
    }
  }],
  participantsHash: { 
    type: String, 
    unique: true,
    required: true
  },
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Message" 
  }
}, { 
  timestamps: true 
});

conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);