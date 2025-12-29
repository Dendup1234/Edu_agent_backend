import mongoose, { Schema, Types } from "mongoose";

const ticketSchema = new Schema({
  eventid: {
    type: Types.ObjectId,
    ref: "Event",
  },
  purchasedDate: {
    type: Date,
  },
  paidAmount:{
    totalpaid:{
        type: String
    },
    currency:{
        type:String
    }
  },
  // Status of the event
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
  },
  // Ticket information
  ticketInfo: {
    ticketNumber: {
      type: Number,
    },
    row: {
      type: String,
    },
    column: {
      type: String,
    },
    qrCode: {
      type: String,
    },
  },
});

export default Ticket = mongoose.model("Ticket", ticketSchema);
