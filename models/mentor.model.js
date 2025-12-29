import mongoose, { Schema,Types } from "mongoose";

const mentorSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: Number,
    },
	mentees:[{
		type: Types.ObjectId,
		ref: 'Student'
	}],
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
		testimonials:{
			type: String,
		}
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

//Mentor Appointment Schema
const appointmentSchema = mongoose.Schema({
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: "Mentor",
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  time: {
    type: Date,
  },
  date: {
    type: Date,
  },
  meeting: [
    {
      mode: {
        type: String,
        enum: ["Online", "In-person"],
      },
      meeting_url: {
        type: String,
      },
    },
  ],
  status: {
    type: String,
    enum: ["Scheduled", "Tentative"],
  },
  purpose: {
    type: String,
  },
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);
