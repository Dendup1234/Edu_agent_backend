import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    User: {
      type: String,
      required: true,
      enum: ["Student", "Mentor","Agent"],
      index: true,
    },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Or a conversation ID
  content: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});
