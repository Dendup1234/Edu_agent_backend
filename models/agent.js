import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const agentSchema = new Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
    },
    // Verifed for the password changed
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

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    assignedStudents: [
      {
        type: Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Agent", agentSchema);
