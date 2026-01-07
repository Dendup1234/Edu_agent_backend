import { Event } from "../../models/event.js"

export const createEvent = async (req, res) => {
    try {
        const organizerId = req.user.sub
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

            agendaItems
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

        organizerId: organizerId
    }); 
    res.status(201).json({message: "Evnet created successfully"})
    } 
    catch(err) {
    res.status(400).json({message: err.message})
    }
}

export const getAllEvents = async(req, res) => {
    try {
        const organizerId = req.user.sub;
        const events = await Event.find({organizerId})
        res.json(events)
    }
    catch (err){
        res.status(400).json({message: err.message})
    }
}

export const getEvent = async(req, res) => {
    try {
        const { eventId } = req.params
        const event = await Event.find(eventId)
        res.json(event)
    }
    catch (err){
        res.status(400).json({message: err.message})
    }
}

export const updateEvent = async(req, res) => {
    try {
        const {eventId} = req.params
        const update = req.body
        const event = await Event.findByIdAndUpdate(
            eventId, update, {
                new: true,
                runValidater: true
            }
        )
        res.json({message: "event updated successful"})
    }
    catch (err){
        res.status(400).json({message: err.message})
    }
}

export const deleteEvent = async(req, res) => {
    try {
        const {eventId} = req.parmas
    }
}