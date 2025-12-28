import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const agentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    agency: {
      type: Types.ObjectId,
      ref: "Agency",
      required: true,
    },

    role: {
      type: String,
      enum: ["visa_officer", "admission_officer", "no-role"],
      default: "no-role",
    },

    isActive: {
      type: Boolean,
      default: true
    },

    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active"
    }
  },
  { timestamps: true }
);

export const Agent = mongoose.model("Agent", agentSchema);
