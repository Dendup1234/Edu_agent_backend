import Ticket from "../../models/ticket.js";
import TicketType from "../../models/ticketType.js";
import Event from "../../models/event.js";
import Student from "../../models/student.js";
import { sendEventSuccessEmail } from "../../utils/sendEmail.js";
import mongoose from "mongoose";
// Only for registeration of online  meeting
export const registerMeeting = async (req, res) => {
  try {
    // global veriable
    const userId = req.user.sub;
    const { eventId } = req.params;
    const event = await Event.findById(eventId).lean();
    // checks if the event exist
    if (!event) return res.status(404).json({ message: "Event not found" });
    // For the online meeting
    if (event.meetings[0].mode === "online") {
      // online booking logic

      // getting the meeting from the event
      const meeting = (event.meetings || []).find((m) => m.mode === "online");
      // if the meeting url does not exist
      if (!meeting?.meetingUrl) {
        return res
          .status(400)
          .json({ message: "This event is not an online event" });
      }
      // prevention of duplicate registration
      const exists = await Ticket.findOne({
        eventId: eventId,
        studentId: userId,
      }).lean();
      console.log(exists);
      if (exists)
        return res.status(409).json({ message: "Already registered" });
      // logic when the ticket sold exceeds the ticket limits
      const reserved = await Event.findOneAndUpdate(
        {
          _id: eventId,
          // filtering condition
          $or: [
            { totalTickets: 0 }, // Unlimited ticket
            { $expr: { $lt: ["$ticketSolds", "$totalTickets"] } }, // ticket sold is less than the total ticket
          ],
        },
        { $inc: { ticketSolds: 1 } },
        { new: true },
      ).lean();
      // if there is no reserved then the event registration is full
      if (!reserved) {
        return res.status(409).json({ message: "Event registration is full" });
      }
      // finding the student snapshot
      const student = await Student.findById(userId)
        .select("name email phone")
        .lean();
      if (!student) {
        // rollback capacity when the student is not found
        await Event.updateOne({ _id: eventId }, { $inc: { ticketSolds: -1 } });
        return res.status(404).json({ message: "Student not found" });
      }
      // creating the ticket snapshot
      let ticket;
      try {
        ticket = await Ticket.create({
          eventId: eventId,
          studentId: userId,
          eventSnapshot: {
            title: event.title,
            meetingUrl: meeting.meetingUrl,
            startAt: event.startAt,
            endAt: event.endAt,
            timezone: event.timezone,
            meetingPass: meeting.meetingPass,
          },
          studentSnapshot: {
            name: student.name,
            email: student.email,
            phone: student.phone,
          },
          status: "confirmed",
        });
      } catch (err) {
        // rollback capacity if create fails
        await Event.updateOne({ _id: eventId }, { $inc: { ticketSolds: -1 } });
        throw err;
      }
      // sending the email to the student
      if (student.email) {
        await sendEventSuccessEmail(student.email, {
          subject: `Registration Confirmed: ${event.title}`,
          title: "Your Event Ticket",
          startTime: `${event.startAt}`,
          timeZone: `${event.timezone}`,
          body: `You are registered for ${event.title}. Click to join:`,
          link: meeting.meetingUrl,
          password: meeting.meetingPass,
        });
      }
      // Registration successful
      return res.status(201).json({
        message: "Registered successfully",
        ticket: {
          id: ticket._id,
          eventTitle: ticket.eventSnapshot.title,
          meetingUrl: ticket.eventSnapshot.meetingUrl,
          startAt: ticket.eventSnapshot.startAt,
        },
      });
    }

    // If the event is seated
    if (event.meetings[0].mode === "seated") {
      // request body for seated event
      const { seatId } = req.body;
      // prevent double booking
      const existing = await Ticket.findOne({
        eventId,
        studentId: userId,
      }).lean();
      if (existing) {
        return res
          .status(409)
          .json({ message: "You already booked this event" });
      }

      // Fetch the seat details (row/columns/ticketTypes) from the event
      const seatDoc = event.seats?.find(
        (s) => String(s._id) === String(seatId),
      );
      if (!seatDoc) {
        return res
          .status(404)
          .json({ message: "Seat not found in this event" });
      }

      if (seatDoc.isBooked) {
        return res.status(409).json({ message: "Seat already booked" });
      }
      const ticketTypeId = seatDoc.ticketTypes; // ObjectId of TicketType
      // Seat with no ticketType Id
      if (!ticketTypeId) {
        return res
          .status(400)
          .json({ message: "Seat has no ticket type assigned" });
      }

      // Ensure ticketType belongs to same event
      const ticketType = await TicketType.findOne({
        _id: ticketTypeId,
      }).lean();

      if (!ticketType) {
        return res
          .status(400)
          .json({ message: "Invalid ticket type for this event" });
      }

      //Atomically book seat by seatId and booking is false
      const seatBooked = await Event.updateOne(
        {
          _id: eventId,
          "seats._id": new mongoose.Types.ObjectId(seatId),
          "seats.isBooked": false,
        },
        {
          $set: { "seats.$.isBooked": true },
          $inc: { ticketSolds: 1 },
        },
      );
      if (seatBooked.modifiedCount === 0) {
        return res.status(409).json({ message: "Seat already booked" });
      }
      // Build student snapshot
      const student = await Student.findById(userId)
        .select("name email phone")
        .lean();

      //Create pending ticket
      const ticket = await Ticket.create({
        eventId,
        studentId: userId,
        eventSnapshot: {
          title: event.title,
          meetingUrl: event.meetings?.[0]?.meetingUrl || "",
          meetingPass: event.meetings?.[0]?.meetingPass || "",
          startAt: event.startAt,
          endAt: event.endAt,
          timezone: event.timezone,
        },

        studentSnapshot: {
          name: student?.name || "",
          email: student?.email || "",
          phone: student?.phone || "",
        },

        ticketInfo: {
          ticketNumber: Date.now(),
          ticketType: ticketTypeId,
          seatNumber: { row: seatDoc.row, columns: seatDoc.columns },
        },

        purchasedDate: new Date(),
        status: "pending",
      });

      return res.status(201).json({
        message: "Seat booked successfully. Waiting for approval.",
        ticket: {
          id: ticket._id,
          status: ticket.status,
          seat: ticket.ticketInfo.seatNumber,
          ticketType: {
            id: ticketType._id,
            name: ticketType.name,
            price: ticketType.price,
          },
        },
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
