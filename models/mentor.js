import mongoose, { Schema, Types } from "mongoose";

const mentorSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: Number,
    },
    mentees: [
      {
        student:{
			type: Types.ObjectId,
			ref: 'Student'
		},
		status:{
			type: String,
			enum:['pending','confirmed','rejected:']
		}
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
    //Mentor free time
    availability: {
      type: [String],
    },
    //Adding the review of the mentor
    review: [
      {
        rating: {
          type: Number,
          min: 0,
          max: 5,
        },
        testimonials: {
          type: String,
        },
      },
    ],
    joinDate: {
      type: Date,
    },
    lastActivity: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamp: true }
);

// exporting the mentor auth model
export const Mentor = mongoose.model("Mentor", mentorSchema);
