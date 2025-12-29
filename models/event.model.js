import mongoose, { Schema, Types } from "mongoose";

//Event schema
const eventSchema = new mongoose.Schema(
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
	// Organized by
	organizerId:{
		type: Types.ObjectId,
		ref: 'Agency'
	},
    // Type & pricing
    eventType: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
      index: true,
    },
	//Capacity
    totalTickets: {
      type: Number,
      min: 0,
    },
    // Date & time
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: "Asia/Thimphu",
    },

    // Registration window
    registration: [
      {
        feeAmount: {
          type: Number,
          min: 0,
          default: 0,
        },
        currency: {
          type: String,
          default: "USD",
        },
        registrationDeadline: {
          type: Date,
          index: true,
        },
        isRegistrationOpen: {
          type: Boolean,
          default: true,
          index: true,
        },
      },
    ],
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
export const Event = mongoose.model("Event", eventSchema);

// Event registration module
const eventRegistrationSchema = mongoose.Schema(
  {
    ticketCode: {
      type: String,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    status: {
      type: String,
      enum: ["registered", "cancelled", "attended", "no_show"],
      default: "registered",
    },

    // Payment (only for paid events)
    payment: {
      required: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
      },
      status: {
        type: String,
        enum: ["unpaid", "pending", "paid", "failed", "refunded"],
        default: "unpaid",
      },
      paidAt: {
        type: Date,
      },
    },

    registeredAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    attendedAt: {
      type: Date,
    },

    seatNumber: {
      type: String,
    },
  },
  { timestamps: true }
);

//Exporting the event registered
export const EventRegistered = mongoose.model(
  "EventRegistered",
  eventRegistrationSchema
);
