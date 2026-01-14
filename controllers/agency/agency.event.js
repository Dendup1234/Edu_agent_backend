import Event from "../../models/event.js";

// creation of events
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

    const event = await Event.create({
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
    res.status(201).json({
      message: "Event created successfully",
      event: event,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: err.message });
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
      { status: "inactive" },
      { new: true }
    );
    return res.status(200).json({ message: "event deactivated", event: event });
  } catch (e) {
    cosole.log(e);
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
