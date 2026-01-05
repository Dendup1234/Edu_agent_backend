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
