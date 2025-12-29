import mongoose, { Schema, Types } from "mongoose";

const ticketSchema = new Schema({
  eventid: {
    type: Types.ObjectId,
    ref: "Event",
  },
  // Ticket information
  ticketInfo: {
    ticketNumber: {
      type: Number,
    },
    ticketType:{
        type:String,
        enum:['standard','permium']
    },
    row: {
      type: String,
    },
    column: {
      type: String,
    },
    //Information about the ticket
    qrCode: {
      type: String,
    },
  },
  purchasedDate: {
    type: Date,
  },
  // Paid based on the ticket type
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
  
});

export default Ticket = mongoose.model("Ticket", ticketSchema);
