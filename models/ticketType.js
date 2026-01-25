// models/TicketType.js
import mongoose, { Schema, Types } from "mongoose";

const ticketTypeSchema = new Schema(
  {
    eventId: { type: Types.ObjectId, ref: "Event" },
    name: { type: String }, // e.g. VIP, Standard
    description: { type: [String], default: [] },
    price: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("TicketType", ticketTypeSchema);
