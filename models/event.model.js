import mongoose from "mongoose";
const EventSchema = new mongoose.Schema(
  {
    // Basic info
    title: { type: String, required: true, trim: true, index: true },
    subtitle: { type: String, trim: true }, 
    bannerImageUrl: { type: String, trim: true },
    description: { type: String, trim: true }, // "About" section (optional)

    // Type & pricing
    eventType: { type: String, enum: ["free", "paid"], default: "free", index: true },

    // Capacity / tickets
    totalSeats: { type: Number, min: 0 }, // e.g. 15
    totalTickets: { type: Number, min: 0 }, // if different from seats
    registeredCount: { type: Number, default: 0, min: 0 }, // cached for quick UI display

    // Date & time
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, default: "Asia/Thimphu", trim: true }, // BST

    // Registration window
    registration:[{
        feeAmount: { type: Number, min: 0, default: 0 }, // e.g. 100
        currency: { type: String, default: "USD", trim: true }, // or "BTN"
        registrationDeadline: { type: Date, index: true },
        isRegistrationOpen: { type: Boolean, default: true, index: true },

    }      
    ],
    // Location (supports onsite + online)
    location: {
      mode: { type: String, enum: ["onsite", "online", "hybrid"], default: "onsite", index: true },
      venueName: { type: String, trim: true }, 
      addressLine: { type: String, trim: true },
      meetingUrl: { type: String, trim: true },
      mapUrl: { type: String, trim: true },
    },

    // Sections shown in your UI
    about: { type: String, trim: true }, // About
    whoShouldAttend: { type: String, trim: true }, // Who should attend

    // Agenda as a list (bullet points)
    agendaItems: [
      {
        title: { type: String, required: true, trim: true }, // "Visa Documentation Guidance"
        startAt: { type: Date }, 
        endAt: { type: Date }, 
        speaker: { type: String, trim: true }, 
        notes: { type: String, trim: true }, 
      },
    ],
  },
  { timestamps: true }
);