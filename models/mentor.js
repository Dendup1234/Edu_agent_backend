import mongoose, { Schema, Types } from "mongoose";

const mentorSchema = new Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: Number,
    },
    mentees: [
      {
        student: {
          type: Types.ObjectId,
          ref: "Student",
        },
        status: {
          type: String,
          enum: ["pending", "confirmed", "rejected"],
          default: "pending",
        },
      },
    ],
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilepic: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    experiences: {
      type: [String],
    },
    education: {
      type: [String],
    },
    //Mentor free times
    availability: {
      type: [String],
    },
    joinDate: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    partnerAgency: {
      type: Types.ObjectId,
      ref: "Agency",
    },
  },
  { timestamp: true },
);

// exporting the mentor auth model
export default mongoose.model("Mentor", mentorSchema);
