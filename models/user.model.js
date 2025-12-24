import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const gUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true,sparse: true, },
    email: { type: String, required: true, unique: true },
    name: String,
  },
  { timestamps: true }
);

const gUser = mongoose.model("GUser", gUserSchema);

export { User, gUser };
