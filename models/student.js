import mongoose, { Schema, Types } from "mongoose";

const StudentSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
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

    emailVerified: {
      type: Boolean,
      default: false,
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
        qualification: { type: String, trim: true },
        institute: { type: String, trim: true },
        year: { type: Number },
        startedAt: { type: Date },
        endedAt: { type: Date },
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    profilePicture: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Student", StudentSchema);
