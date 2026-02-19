import mongoose, { Schema, Types } from "mongoose";
//Mentor Appointment Schema
const appointmentSchema = new Schema({
  mentorId: {
    type: Types.ObjectId,
    ref: "Mentor",
  },
  studentId: {
    type: Types.ObjectId,
    ref: "Student",
  },
  // For agent
  agentId: {
    type: Types.ObjectId,
    ref: "Agent",
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
    },
  ],
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled"],
    default: "Scheduled",
  },
  purpose: {
    type: String,
  },
  // for the system calander
  google: {
    calendarId: String,
    eventId: String,
    htmlLink: String,
    meetLink: String,
  },
});

export default mongoose.model("Appointment", appointmentSchema);
