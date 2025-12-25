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
      minlength: 8
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,

    googleId: {
      type: String
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
