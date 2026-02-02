import mongoose, { Schema, Types } from "mongoose";

const notificationSchema = new Schema(
  {
    receiverType: {
      type: String,
      enum: ["Student", "Mentor", "Agent", "Agency"],
    },
    receiverId: {
      type: Types.ObjectId,
      refPath: "receiverType",
    },

    triggeredByType: {
      type: String,
      enum: ["Student", "Mentor", "Agent", "Agency"],
    },
    triggeredById: {
      type: Types.ObjectId,
      refPath: "triggeredByType",
    },

    title: { type: String, required: true },
    body: { type: String, required: true },

    expoTicketId: { type: String, default: null },
    // status
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
    },
    error: { type: String, default: null },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);
