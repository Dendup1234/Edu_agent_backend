import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const agentSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    agency: {
      type: Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    systemRole: {
      type: String,
      enum: ["visa_officer", "admission_officer", "none"],
      default: "none",
      index: true,
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

    // Better for quick workload filtering
    currentWorkload: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    maxCapacity: {
      type: Number,
      default: 20,
      min: 1,
    },

    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "leave"],
      default: "available",
      index: true,
    },

    // Structured matching fields
    specializedCountries: [
      {
        type: String,
        trim: true,
      },
    ],

    specializedUniversities: [
      {
        type: Types.ObjectId,
        ref: "University",
      },
    ],

    specializedCourseLevels: [
      {
        type: String,
        enum: ["High School", "Diploma", "Bachelor", "Master", "PhD"],
      },
    ],

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    experienceLevel: {
      type: String,
      enum: ["junior", "mid", "senior"],
      default: "junior",
    },

    // Optional human-readable note
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Useful compound index for fast candidate filtering
agentSchema.index({
  agency: 1,
  systemRole: 1,
  isActive: 1,
  availabilityStatus: 1,
  currentWorkload: 1,
});

export default mongoose.model("Agent", agentSchema);
