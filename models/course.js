import mongoose, { Schema, Types } from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    //level of the courses
    level: {
      type: String,
      enum: ["undergraduate", "graduate", "diploma", "phd"],
	  default: "undergraduate"
    },
    //About field
    about: {
      type: String,
    },
    duration: {
      type: String,
    },
    tuitionFee: {
      totalfee: {
        type: String,
      },
      currency: {
        type: String,
      },
    },
    description: {
      type: String,
    },
    entryRequirements: {
      type: [String],
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    // Max number of student in the courses
    intakes: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
