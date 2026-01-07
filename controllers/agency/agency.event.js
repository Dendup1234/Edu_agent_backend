import Event from "../../models/event.js"

const createEvent = async (req, res) => {
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

    
}