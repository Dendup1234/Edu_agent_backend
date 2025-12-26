import mongoose from "mongoose";
const {Schema,Types} = mongoose;

const notificationSchema = new Schema({
    
    receiverId: {
        type: Types.ObjectId,
        required: true,
        refPath: "userType",
        index: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Student", "Mentor"],
      index: true,
    },
    triggeredById: {
      type: Types.ObjectId,
      refPath: "userType",
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    },
    {
        timestamps: true
    }
);

export const Notification = mongoose.model('Notification',notificationSchema);