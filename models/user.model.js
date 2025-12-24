import mongoose from "mongoose";

export const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 60,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false, // by default, don't return password in queries
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		verificationCode: String
	},
	{ timestamps: true },
);

mongoose.model("User", userSchema);

export const gUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: String,
  },
  { timestamps: true }
);

mongoose.model("gUser", gUserSchema);