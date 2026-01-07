import mongoose from "mongoose";
import student from "./student";
const { Schema, Types } = mongoose;

const agentSchema = new Schema(
  {
    name: {
      type: String
    },

    email: {
      type: String
    },

    password: {
      type: String
    },

    googleId: {
      type: String
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    profileUrl: {
      type: String,
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

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    assignedStudents: [
      {
        type: Types.ObjectId,
        ref: student
      }
    ]
  },
  { timestamps: true }
);

export const Agent = mongoose.model("Agent", agentSchema);
