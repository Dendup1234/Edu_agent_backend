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
    //Ticket types
    ticketTypes: [
      {
        types: {
          type: String,
        },
        description: {
          type: [String],
        },
        price: {
          type: String,
        },
      },
    ],
    description: {
      type: String,
    },
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
          enum: ["onsite", "online", "hybrid"],
          default: "onsite",
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
    // Agenda as a list (bullet points)
    agendaItems: {
      type: [String],
    },
  },
  { timestamps: true }
);

///Exporting the event model
export default mongoose.model("Event", eventSchema);
