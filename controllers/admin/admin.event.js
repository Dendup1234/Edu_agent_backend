import Event from "../../models/event.js";

// Getting all the events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate({
      path: "organizerId",
      select: "organizationName",
    });
    return res.status(200).json({ message: "Success", events: events });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Searching the events by name
export const searchEventsByName = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    // Event search
    const event = await Event.find({
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

// event active and inactive
export const getEventStatusCount = async (req, res) => {
  try {
    const result = await Event.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let active = 0;
    let inactive = 0;

    result.forEach((r) => {
      if (r._id === true) active = r.count;
      if (r._id === false) inactive = r.count;
    });

    return res.status(200).json({
      active,
      inactive,
      total: active + inactive,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
