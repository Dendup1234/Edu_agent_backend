import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const notificationSchema = new Schema({
	// User type for the notification
	userType: {
		type: String,
		enum: ["Student", "Mentor", "Agent"],
	},

	receiverId: {
		type: Types.ObjectId,
		refPath: "userType",

	},
	triggeredById: {
		type: Types.ObjectId,
		refPath: "userType",
	},
	//Notification types like alert or accepted notification
	type: {
		type: String,
		required: true,
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
	},
},
	{
		timestamps: true
	}
);

export const Notification = mongoose.model('Notification', notificationSchema);
