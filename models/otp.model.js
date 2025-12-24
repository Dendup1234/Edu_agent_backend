import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, index: true },
		otpHash: { type: String, required: true },
		expiresAt: { type: Date, required: true },
		resendCount: { type: Number, default: 0 },
		lastSentAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
