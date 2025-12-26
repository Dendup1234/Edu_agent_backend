import mongoose from "mongoose";

//Event schema
const eventSchema = new mongoose.Schema(
  {
    // Basic info
    title: { type: String, required: true},
    subtitle: { type: String }, 
    bannerImageUrl: { type: String },
    description: { type: String },

    // Type & pricing
    eventType: { type: String, enum: ["free", "paid"], default: "free", index: true },

    // Capacity
    totalSeats: { 
        type: Number, 
        min: 0 
    },
    totalTickets: { 
        type: Number, 
        min: 0 
    },
    registeredCount: { 
        type: Number,
        default: 0, 
        min: 0 },
    // Date & time
    startAt: { 
        type: Date, 
        required: true, 
        index: true 
    },
    endAt: { 
        type: Date, 
        required: true 
    },
    timezone: { 
        type: String, 
        default: "Asia/Thimphu" 
    },

    // Registration window
    registration:[{
        feeAmount: { 
            type: Number, 
            min: 0, 
            default: 0 
        },
        currency: { 
            type: String, 
            default: "USD" 
        },
        registrationDeadline: { 
            type: Date, 
            index: true 
        },
        isRegistrationOpen: { 
            type: Boolean, 
            default: true, 
            index: true },

    }      
    ],
    // Location 
    location: {
      mode: { 
        type: String, 
        enum: ["onsite", "online", "hybrid"], 
        default: "onsite", 
        index: true 
    },
      venueName: { 
        type: String 
    }, 
      addressLine: { 
        type: String 
    },
      meetingUrl: { 
        type: String 
    },
      mapUrl: { 
        type: String 
    },
    },
    about: { 
        type: String 
    }, 
    whoShouldAttend: { 
        type: String 
    }, 

    // Agenda as a list (bullet points)
    agendaItems: [
      {
        title: { 
            type: String, 
            required: true 
        },
        startAt: { 
            type: Date 
        }, 
        endAt: {
             type: Date 
            }, 
        speaker: { 
            type: String 
        }, 
        notes: { 
            type: String 
        }, 
      },
    ],
  },
  { timestamps: true }
);

///Exporting the event model
export const Event = mongoose.model("Event",eventSchema);

// Event registration module
const eventRegistrationSchema = mongoose.Schema({
    eventId: { 
        type: Types.ObjectId, 
        ref: "Event", 
        required: true },
    studentId: { 
        type: Types.ObjectId, 
        ref: "StudentProfile", 
        required: true},

    status: {
      type: String,
      enum: ["registered", "cancelled", "attended", "no_show"],
      default: "registered",
    },

    // Payment (only for paid events)
    payment: {
      required: { 
        type: Boolean, 
        default: false },
      amount: { 
        type: Number, 
        min: 0 },
      currency: { 
        type: String
    },
      status: { 
        type: String, 
        enum: ["unpaid", "pending", "paid", "failed", "refunded"], 
        default: "unpaid" 
    },
      provider: { 
        type: String
    },
      reference: { 
        type: String
    }, 
      paidAt: { 
        type: Date 
    },
    },

    registeredAt: {
         type: Date, 
         default: Date.now 
    },
    cancelledAt: { 
        type: Date 
    },
    attendedAt: { 
        type: Date 
    },

    //Stores ticket/seat info if you allocate seats
    ticketCode: { 
        type: String
     },
    seatNumber: {
         type: String 
     },
},
{timestamp: true}
);

//Exporting the event registered
export const EventRegistered = mongoose.model('EventRegistered',eventRegistrationSchema);
