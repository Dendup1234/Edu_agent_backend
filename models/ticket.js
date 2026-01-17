import mongoose, { Schema, Types } from "mongoose";

const ticketSchema = new Schema({
  eventId: {
    type: Types.ObjectId,
    ref: "Event",
  },
  studentId: {
    type: Types.ObjectId,
    ref: "Student",
  },

  // Snapshot of event to be sended to the student when registered
  eventSnapshot: {
    title: String,
    meetingUrl: String,
    startAt: Date,
    endAt: Date,
    timezone: String,
    meetingPass: String,
  },

  studentSnapshot: {
    name: String,
    email: String,
    phone: String,
  },
  // Ticket information for the seated one
  ticketInfo: {
    ticketNumber: {
      type: Number,
    },
    ticketType: {
      type: String,
    },
    seatNumber: {
      row: {
        type: String,
      },
      columns: {
        type: String,
      },
    },
  },
  purchasedDate: {
    type: Date,
  },
  // Paid based on the ticket type
  paidAmount: {
    totalpaid: {
      type: String,
    },
    currency: {
      type: String,
    },
  },
  // Status of the event
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
  },
});

export default mongoose.model("Ticket", ticketSchema);
