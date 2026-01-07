import mongoose, { Schema, Types } from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    //level of the courses
    level: {
      type: String,
      enum: ["Undergraduate", "Graduate", "Diploma", "PhD"],
	  default: "Undergraduate"
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
		deafult:""
      },
      currency: {
        type: String,
		default:""
      },
    },
    description: {
      type: String,
	  deafult: "",
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
	  default: 0
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
