import mongoose, { Schema, Types } from "mongoose";

const universitySchema = new Schema(
  {
    name: {
      type: String,
    },
    profileUrl: {
      type: String,
    },
    websiteURL: {
      type: String,
    },
    country: {
      type: String,
    },
    about: {
      type: String,
    },
    mission: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    courses: [
      {
        type: Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("University", universitySchema);
