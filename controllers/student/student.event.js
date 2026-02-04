import Ticket from "../../models/ticket.js";
import TicketType from "../../models/ticketType.js";
import Event from "../../models/event.js";
import Student from "../../models/student.js";
import {
  sendEventSuccessEmail,
  sendSeatedEventSuccessEmail,
} from "../../utils/sendEmail.js";
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
      const { seatIds } = req.body;
      // validate the request body
      if (!Array.isArray(seatIds) || seatIds.length === 0) {
        return res
          .status(400)
          .json({ message: "seatIds must be a non-empty array" });
      }

      // remove duplicates from the request body(avoid double charge / double booking attempts)
      const uniqueSeatIds = [...new Set(seatIds.map(String))];

      // finding out if the event is missing or not
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (!event.status)
        return res.status(400).json({ message: "Event is not active" });

      // finding the student by their id
      const student = await Student.findById(userId)
        .select("name email phone")
        .lean();

      // student not founds
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      // Seat map for fast lookup (from current event snapshot)
      const seatMap = new Map(
        (event.seats || []).map((s) => [String(s._id), s]),
      );

      // Prefetch ticket types needed
      const ticketTypeIdsNeeded = [
        ...new Set(
          uniqueSeatIds
            .map((sid) => seatMap.get(String(sid))?.ticketTypes)
            .filter(Boolean) // removes any undefined or null result
            .map(String),
        ),
      ];
      // Fetching the unique ticket types information only
      const ticketTypes = await TicketType.find({
        _id: { $in: ticketTypeIdsNeeded },
      })
        .select("name price")
        .lean();

      // Maping the ticketType for faster lookup through their index(_id)
      const ticketTypeMap = new Map(
        ticketTypes.map((tt) => [String(tt._id), tt]),
      );

      // Loop each seat and attempt booking + ticket creation
      const results = [];
      const createdTicketIds = [];
      const bookedSeatIds = [];
      const bookedSeatLabels = [];
      let totalPrice = 0;

      // Looping concept used here for each transaction
      for (const seatId of uniqueSeatIds) {
        try {
          // Validate seat exists in this event
          const seatDoc = seatMap.get(String(seatId));
          if (!seatDoc) throw new Error("Seat not found in this event");

          // Validate ticket type for seat
          const ticketTypeId = seatDoc.ticketTypes;
          if (!ticketTypeId)
            throw new Error("Seat has no ticket type assigned");

          const tt = ticketTypeMap.get(String(ticketTypeId));
          if (!tt) throw new Error("Invalid ticket type for this seat");

          // Atomically lock this seat (prevents double booking)
          const lockRes = await Event.updateOne(
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
          // if it is not modified or not updated
          if (lockRes.modifiedCount === 0) {
            throw new Error("Seat already booked");
          }

          // Create ticket for this seat
          let ticket;
          try {
            ticket = await Ticket.create({
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
                name: student.name || "",
                email: student.email || "",
                phone: student.phone || "",
              },

              ticketInfo: {
                ticketNumber: Date.now(), // dendup replace with better ticket numbering
                ticketType: ticketTypeId,
                seatNumber: { row: seatDoc.row, columns: seatDoc.columns },
              },

              purchasedDate: new Date(),
              status: "confirmed",
            });
          } catch (e) {
            // rollback if the ticket booking false
            await Event.updateOne(
              {
                _id: eventId,
                "seats._id": new mongoose.Types.ObjectId(seatId),
              },
              {
                $set: { "seats.$.isBooked": false },
                $inc: { ticketSolds: -1 },
              },
            );
            throw e;
          }
          // Collect success info
          createdTicketIds.push(ticket._id);
          bookedSeatIds.push(String(seatId));
          bookedSeatLabels.push(`${seatDoc.row}${seatDoc.columns}`);

          const priceNum = Number(tt.price ?? 0);
          totalPrice += Number.isFinite(priceNum) ? priceNum : 0;

          results.push({
            seatId: String(seatId),
            success: true,
            ticketId: ticket._id,
            seat: { row: seatDoc.row, columns: seatDoc.columns },
            ticketType: { id: tt._id, name: tt.name, price: tt.price },
          });
        } catch (err) {
          results.push({
            seatId: String(seatId),
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
      //end of loop

      // Link all created tickets to student in one DB call
      if (createdTicketIds.length > 0) {
        await Student.updateOne(
          { _id: userId },
          { $addToSet: { ticket: { $each: createdTicketIds } } },
        );
      }

      // Send a email with all successful seats
      if (student.email && bookedSeatIds.length > 0) {
        await sendSeatedEventSuccessEmail(student.email, {
          subject: `Registration Confirmed: ${event.title}`,
          title: "Your Event Ticket(s)",
          startTime: event.startAt,
          timeZone: event.timezone || "Asia/Thimphu",
          body: `You successfully booked ${bookedSeatIds.length} seat(s) for ${event.title}.`,
          seats: bookedSeatLabels.join(", "),
          seatIds: bookedSeatIds,
          ticketType: bookedSeatIds.length > 1 ? "Multiple" : undefined,
          totalPrice,
        });
      }
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      // success message
      return res.status(200).json({
        message: "Processed seat booking request",
        eventId,
        successCount,
        failCount,
        totalPrice,
        results,
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
