import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation', 
      required: true,      
      index: true          
    },
    senderModel: {
      type: String,
      enum: ["Student", "Mentor", "Agent", "Agency"],
      required: true  
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
      required: true 
    },
    receiverModel: {
      type: String,
      enum: ["Student", "Mentor", "Agent", "Agency"],
      required: true 
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receiverModel",
      required: true  
    },
    content: {
      type: String,
      trim: true,
      required: true,  
      maxlength: 5000  
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    isWelcomeMessage: {type: Boolean},

    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

// index
messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });
messageSchema.index({ receiver: 1, status: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index(
  { conversationId: 1, isWelcomeMessage: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("Message", messageSchema);