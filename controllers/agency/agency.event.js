import Event from "../../models/event.js";
import TicketType from "../../models/ticketType.js";
import Ticket from "../../models/ticket.js";
import mongoose from "mongoose";
import { sendSeatedEventSuccessEmail } from "../../utils/sendEmail.js";
import ticketType from "../../models/ticketType.js";
import Student from "../../models/student.js";
// creation of event
export const createEvent = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const {
      title,
      subtitle,
      bannerImageUrl,
      description,
      totalTickets,
      startAt,
      endAt,
      timezone,
      meetings,
      location,
      about,
      whoShouldAttend,
      agendaItems,
    } = req.body;

    let event = await Event.create({
      title,
      subtitle,
      bannerImageUrl,
      description,
      totalTickets,
      startAt,
      endAt,
      timezone,
      meetings,
      location,
      about,
      whoShouldAttend,
      agendaItems,
      organizerId: userId,
    });
    // if event is seated type then status is false until seat is created
    if (event.meetings[0].mode === "seated") {
      event = await Event.findByIdAndUpdate(
        event._id,
        {
          status: false,
        },
        { new: true },
      );
    }
    res.status(201).json({
      message: "Event created successfully",
      event: event,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

// Getting all the events in the agency page
export const getAllEvents = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const events = await Event.find({ organizerId: userId });
    return res.status(200).json({ message: "Success", events: events });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

// Getting all the events in the student page
export const getAllEventsStudent = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const events = await Event.find({ organizerId: agencyId });
    return res.status(200).json({ message: "Success", events: events });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Getting event by their id
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.status(200).json({
      message: "Success",
      event: event,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Updating the event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const update = req.body;
    const event = await Event.findByIdAndUpdate(eventId, update, {
      new: true,
      runValidater: true,
    });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.status(200).json({
      message: "event updated successful",
      event: event,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Deactivating the event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndUpdate(
      eventId,
      { status: false },
      { new: true },
    );
    return res.status(200).json({ message: "event deactivated", event: event });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Searching the events
export const searchEventsByName = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    // Event search
    const event = await Event.find({
      organizerId: userId,
      title: { $regex: q, $options: "i" },
    }).lean();

    return res.status(200).json({
      message: "Successful",
      event: event,
    });
  } catch (e) {
    cosole.log(e);
    res.status(500).json({ message: e.message });
  }
};

// Creating a ticket type for the event
export const createTicketType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, price } = req.body;
    // creating a ticket types
    const ticketType = await TicketType.create({
      name,
      description,
      price,
      eventId: eventId,
    });
    return res
      .status(200)
      .json({ message: "Created successfully", ticketType: ticketType });
  } catch (e) {
    cosole.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Getting all the ticket type
export const getAllTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    // getting all the ticket
    const ticketTypes = await TicketType.find({
      eventId: eventId,
    });
    return res.status(200).json({
      message: "Extracted successfully",
      ticketType: ticketTypes,
    });
  } catch (e) {
    cosole.log(e);
    res.status(500).json({ message: e.message });
  }
};

// updating the ticket type
export const updateTicketType = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;
    const update = req.body;
    const updatedTicketType = await TicketType.findByIdAndUpdate(
      ticketId,
      update,
      { new: true },
      { runValidater: true },
    );
    return res
      .status(200)
      .json({ message: "Updated successfully", ticketType: updatedTicketType });
  } catch (e) {
    cosole.log(e);
    res.status(500).json({ message: e.message });
  }
};

// Assiging the seats with their respective ticket types
export const assigningSeatTypes = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { seats } = req.body;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "seats array is required" });
    }

    // basic validation
    for (const s of seats) {
      if (!s.row || !s.columns || !s.ticketTypes) {
        return res.status(400).json({
          message: "Each seat must have row, columns, and ticketTypes",
        });
      }
    }

    // Load existing seats just to prevent duplicates
    const event = await Event.findById(eventId).select("seats").lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existingSet = new Set(
      (event.seats || []).map((s) => `${s.row}:${s.columns}`),
    );

    // keep only new seats
    const newSeats = seats.filter(
      (s) => !existingSet.has(`${s.row}:${s.columns}`),
    );

    if (newSeats.length === 0) {
      return res
        .status(409)
        .json({ message: "All provided seats already exist" });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        $push: { seats: { $each: newSeats } },
        $set: { status: true },
      },
      { new: true, runValidators: true },
    ).lean();

    return res.status(200).json({
      message: "Seats added successfully",
      addedCount: newSeats.length,
      event: updatedEvent,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: e.message });
  }
};

//Updating the seats with ticketTypeId
export const updateSeatType = async (req, res) => {
  try {
    const { eventId, seatId } = req.params;
    const { ticketTypeId } = req.body;

    if (!ticketTypeId) {
      return res.status(400).json({ message: "ticketTypeId is required" });
    }

    const updated = await Event.updateOne(
      {
        _id: eventId,
        "seats._id": seatId,
      },
      {
        $set: {
          "seats.$.ticketTypes": ticketTypeId,
        },
      },
    );

    if (updated.modifiedCount === 0) {
      return res.status(404).json({ message: "Seat not found or not updated" });
    }

    return res.status(200).json({
      message: "Seat updated successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: e.message });
  }
};

// Getting the seat information
export const getSeatInformation = async (req, res) => {
  try {
    const { seatId } = req.params;

    const event = await Event.findOne({ "seats._id": seatId }, { "seats.$": 1 })
      .populate({
        path: "seats.ticketTypes",
        select: "name description price",
      })
      .lean();

    if (!event || !event.seats.length) {
      return res.status(404).json({ message: "Seat not found" });
    }

    res.json({
      message: "Success",
      seat: event.seats[0],
    });
  } catch (e) {
    cosole.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Getting the ticket organized by the agency
export const getTickets = async (req, res) => {
  try {
    const userId = req.user.agencyId;
    // Getting all the events from the agency id
    const events = await Event.find({ organizerId: userId }).select(
      "_id title startAt endAt timezone",
    );
    // if there is no events then
    if (!events.length) {
      return res.json({
        eventsCount: 0,
        ticketsCount: 0,
        tickets: [],
      });
    }
    const eventIds = events.map((e) => e._id);

    // getting all tickets for those events
    const tickets = await Ticket.find({ eventId: { $in: eventIds } })
      .select("status")
      .sort({ createdAt: -1 }) // retrives the most lastest ticket
      .populate({
        path: "eventId",
        select: "title startAt endAt timezone organizerId meetings",
      })
      .populate({ path: "studentId", select: "name email phone" })
      .populate({
        path: "ticketInfo.ticketType",
        select: "name price description",
      });

    return res.json({
      eventsCount: events.length,
      ticketsCount: tickets.length,
      tickets,
    });
  } catch (e) {
    cosole.log(e);
    res.status(500).json({ message: e.message });
  }
};
// Searching ticket by their name
export const searchTickets = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const { eventName } = req.query;

    const eventFilter = {
      organizerId: agencyId,
    };

    // If searching by event name
    if (eventName) {
      eventFilter.title = { $regex: eventName, $options: "i" };
    }

    // Get all matching events
    const events = await Event.find(eventFilter).select(
      "_id title startAt endAt timezone",
    );

    if (!events.length) {
      return res.json({
        eventsCount: 0,
        ticketsCount: 0,
        tickets: [],
      });
    }

    const eventIds = events.map((e) => e._id);

    // Get all tickets for those events
    const tickets = await Ticket.find({ eventId: { $in: eventIds } })
      .select("status createdAt ticketInfo")
      .sort({ createdAt: -1 })
      .populate({
        path: "eventId",
        select: "title startAt endAt timezone organizerId meetings",
      })
      .populate({
        path: "studentId",
        select: "name email phone",
      })
      .populate({
        path: "ticketInfo.ticketType",
        select: "name price description",
      });

    return res.json({
      eventsCount: events.length,
      ticketsCount: tickets.length,
      tickets,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
