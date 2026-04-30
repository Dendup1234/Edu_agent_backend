import mongoose, { Schema, Types } from "mongoose";

const StudentSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    profileUrl: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    googleId: {
      type: String,
    },

    registeredAgency: {
      type: Types.ObjectId,
      ref: "Agency",
      index: true,
    },
    // assignedAgent
    assignedAgent: {
      type: Types.ObjectId,
      ref: "Agent",
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "admission_assigned",
        "admission_in_progress",
        "offer_received",
        "ready_for_visa",
        "visa_assigned",
        "visa_in_progress",
        "converted",
        "lost",
      ],
      default: "new",
      index: true,
    },

    // Important for compatibility matching
    preferredCountry: {
      type: String,
      trim: true,
      index: true,
    },

    selectedUniversity: {
      type: Types.ObjectId,
      ref: "University",
      index: true,
    },

    selectedCourse: {
      type: Types.ObjectId,
      ref: "Course",
    },

    nationality: {
      type: String,
      trim: true,
    },

    dob: {
      type: Date,
    },

    education: [
      {
        qualification: {
          type: String,
          enum: [
            "High School",
            "Diploma",
            "Bachelor Degree",
            "Undergraduate",
            "Master",
          ],
        },
        institute: { type: String, trim: true },
        year: { type: Number },
        startedAt: { type: Date },
        endedAt: { type: Date },
      },
    ],

    connectedMentor: {
      status: {
        type: String,
        enum: ["pending", "rejected", "confirmed"],
      },
      mentor: {
        type: Types.ObjectId,
        ref: "Mentor",
      },
    },

    ticket: [
      {
        type: Types.ObjectId,
        ref: "Ticket",
      },
    ],

    // Separate assignment fields for each stage
    assignedAdmissionOfficer: {
      type: Types.ObjectId,
      ref: "Agent",
      default: null,
      index: true,
    },

    assignedVisaOfficer: {
      type: Types.ObjectId,
      ref: "Agent",
      default: null,
      index: true,
    },

    assignmentHistory: [
      {
        role: {
          type: String,
          enum: ["admission_officer", "visa_officer"],
          required: true,
        },
        agent: {
          type: Types.ObjectId,
          ref: "Agent",
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: String,
          enum: ["manual", "automation"],
          default: "automation",
        },
        reason: {
          type: String,
          trim: true,
        },
      },
    ],

    isValid: {
      type: Boolean,
      default: true,
    },

    expoPushToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Useful filtering index
StudentSchema.index({
  registeredAgency: 1,
  status: 1,
  preferredCountry: 1,
  selectedUniversity: 1,
});

export default mongoose.model("Student", StudentSchema);
