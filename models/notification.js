import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const notificationSchema = new Schema({
	// User type for the notification
	userType: {
		type: String,
		required: true,
		enum: ["Student", "Mentor", "Agent"],
		index: true,
	},

	receiverId: {
		type: Types.ObjectId,
		required: true,
		refPath: "userType",
		index: true,
	},
	triggeredById: {
		type: Types.ObjectId,
		refPath: "userType",
	},
	//Notification types like alert or accepted notification
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

export const Notification = mongoose.model('Notification', notificationSchema);
