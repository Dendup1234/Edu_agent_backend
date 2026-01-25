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
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "negotiated",
        "applied",
        "converted",
        "lost",
      ],
      default: "new",
    },

    selectedUniversity: {
      type: Types.ObjectId,
      ref: "University",
    },

    selectedCourse: {
      type: Types.ObjectId,
      ref: "Course",
    },

    ticket: [
      {
        type: Types.ObjectId,
        ref: "Ticket",
      },
    ],

    dob: {
      type: Date,
    },

    nationality: {
      type: String,
      trim: true,
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

    isValid: {
      type: Boolean,
      default: true,
    },
    onlineStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true },
);

export default mongoose.model("Student", StudentSchema);
