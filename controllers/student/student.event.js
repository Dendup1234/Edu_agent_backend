import Ticket from "../../models/ticket.js";
import Event from "../../models/event.js";
import Student from "../../models/student.js";
import { sendEventSuccessEmail } from "../../utils/sendEmail.js";
// Only for registeration of online  meeting
export const registerMeeting = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { eventId } = req.params;
    const event = await Event.findById(eventId).lean();

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
        { new: true }
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
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
