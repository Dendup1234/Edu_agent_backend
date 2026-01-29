import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    profileUrl: {
      type: String,
    },
    password: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "admin"],
    },
    phone: {
      type: String,
    },
  },

  { timestamps: true },
);

export default mongoose.model("Admin", adminSchema);
