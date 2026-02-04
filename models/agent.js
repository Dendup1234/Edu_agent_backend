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
    // Verifed for the password changeds
    isVerified: {
      type: Boolean,
      default: false,
    },
    // for dactivation
    isActive: {
      type: Boolean,
      default: true,
    },
    agency: {
      type: Types.ObjectId,
      ref: "Agency",
      required: true,
    },

    // fixed roles
    systemRole: {
      type: String,
      enum: ["visa_officer", "admission_officer", "none"],
      default: "none",
    },
    roleId: {
      type: Types.ObjectId,
      ref: "Role",
      default: null,
    },
    assignedStudents: [
      {
        type: Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Agent", agentSchema);
