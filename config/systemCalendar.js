import { gcal } from "./googleCalendar.js";

export async function createSystemCalendarEvent({
  title,
  description,
  startISO,
  endISO,
  timezone,
  receiverEmail,
  senderEmail,
}) {
  const attendees = [];
  if (receiverEmail) attendees.push({ email: receiverEmail });
  if (senderEmail) attendees.push({ email: senderEmail });

  const res = await gcal.events.insert({
    calendarId: process.env.SYSTEM_CALENDAR_ID,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startISO, timeZone: timezone },
      end: { dateTime: endISO, timeZone: timezone },
    },
  });

  return {
    eventId: res.data.id,
    htmlLink: res.data.htmlLink,
    meetLink: res.data.hangoutLink || null,
  };
}
