import mongoose, { Schema, Types } from "mongoose";

//Event schema
const eventSchema = new Schema(
  {
    // Basic info
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    bannerImageUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    seats: [
      {
        row: {
          type: String,
        },
        columns: {
          type: String,
        },
        ticketTypes: {
          type: Types.ObjectId,
          ref: "TicketType",
        },
        isBooked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Organized by
    organizerId: {
      type: Types.ObjectId,
      ref: "Agency",
    },
    //Capacity
    totalTickets: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Total ticket sold
    ticketSolds: {
      type: Number,
      default: 0,
    },
    // Date & time
    startAt: {
      type: Date,
    },
    endAt: {
      type: Date,
    },
    timezone: {
      type: String,
      default: "Asia/Thimphu",
    },

    // Meeting informations
    meetings: [
      {
        mode: {
          type: String,
          enum: ["seated", "online", "open-space"],
          default: "online",
        },
        meetingUrl: {
          type: String,
        },
        meetingPass: {
          type: String,
        },
      },
    ],
    // Location
    location: {
      venueName: {
        type: String,
      },
      addressLine: {
        type: String,
      },
    },
    about: {
      type: String,
    },
    whoShouldAttend: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    // Agenda as a list (bullet points)
    agendaItems: {
      type: [String],
    },
  },
  { timestamps: true }
);

///Exporting the event model
export default mongoose.model("Event", eventSchema);
