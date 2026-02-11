import request from "supertest";
import { expect } from "chai";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import app from "../test.js";
import { before, after, beforeEach, describe, it } from "mocha";
import { connectTestDB, clearTestDB, closeTestDB } from "./setup.db.js";

import Student from "../models/student.js";
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import TicketType from "../models/ticketType.js";

describe("POST /api/v1/students/events/registration/:eventId", () => {
  before(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  after(async () => {
    await closeTestDB();
  });

  const loginStudentAndGetToken = async ({
    email = "s@example.com",
    password = "123456",
    name = "Student",
  } = {}) => {
    await Student.create({
      name,
      email,
      phone: "111",
      password: await bcrypt.hash(password, 12),
    });

    const res = await request(app).post("/api/v1/students/login").send({
      email,
      password,
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("accessToken");
    return res.body.accessToken;
  };

  // ----------------------------
  // COMMON
  // ----------------------------

  it("-> 401 if no token", async () => {
    const res = await request(app).post(
      `/api/v1/students/events/registration/${new mongoose.Types.ObjectId().toString()}`,
    );
    expect(res.status).to.equal(401);
  });

  it("-> 404 if event not found", async () => {
    const token = await loginStudentAndGetToken();
    const missingEventId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${missingEventId.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal("Event not found");
  });

  // ----------------------------
  // ONLINE MODE
  // ----------------------------

  it("ONLINE -> 400 if meetingUrl missing", async () => {
    const token = await loginStudentAndGetToken({
      email: "online1@example.com",
    });

    const event = await Event.create({
      title: "Online Event",
      timezone: "Asia/Thimphu",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000),
      ticketSolds: 0,
      totalTickets: 10,
      status: true,
      meetings: [{ mode: "online", meetingUrl: "", meetingPass: "123" }],
    });

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${event._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("This event is not an online event");
  });

  it("ONLINE -> 409 if already registered", async () => {
    const token = await loginStudentAndGetToken({
      email: "online2@example.com",
    });
    const student = await Student.findOne({
      email: "online2@example.com",
    }).lean();

    const event = await Event.create({
      title: "Online Dup",
      timezone: "Asia/Thimphu",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000),
      ticketSolds: 0,
      totalTickets: 10,
      status: true,
      meetings: [
        { mode: "online", meetingUrl: "https://meet.com/dup", meetingPass: "" },
      ],
    });

    await Ticket.create({
      eventId: event._id,
      studentId: student._id,
      eventSnapshot: { title: event.title, meetingUrl: "https://meet.com/dup" },
      studentSnapshot: {
        name: student.name,
        email: student.email,
        phone: student.phone,
      },
      status: "confirmed",
    });

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${event._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal("Already registered");
  });

  it("ONLINE -> 409 if registration full (ticketSolds >= totalTickets)", async () => {
    const token = await loginStudentAndGetToken({
      email: "online3@example.com",
    });

    const event = await Event.create({
      title: "Online Full",
      timezone: "Asia/Thimphu",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000),
      ticketSolds: 1,
      totalTickets: 1,
      status: true,
      meetings: [
        {
          mode: "online",
          meetingUrl: "https://meet.com/full",
          meetingPass: "",
        },
      ],
    });

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${event._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal("Event registration is full");
  });

  it("ONLINE -> 201 registers, creates ticket, increments ticketSolds", async () => {
    const token = await loginStudentAndGetToken({
      email: "online4@example.com",
    });
    const student = await Student.findOne({
      email: "online4@example.com",
    }).lean();

    const event = await Event.create({
      title: "Online OK",
      timezone: "Asia/Thimphu",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000),
      ticketSolds: 0,
      totalTickets: 2,
      status: true,
      meetings: [
        {
          mode: "online",
          meetingUrl: "https://zoom.us/j/123",
          meetingPass: "999",
        },
      ],
    });

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${event._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(201);
    expect(res.body.message).to.equal("Registered successfully");
    expect(res.body.ticket).to.have.property("id");
    expect(res.body.ticket.meetingUrl).to.equal("https://zoom.us/j/123");

    const created = await Ticket.findOne({
      eventId: event._id,
      studentId: student._id,
    }).lean();
    expect(created).to.exist;
    expect(created.status).to.equal("confirmed");

    const updatedEvent = await Event.findById(event._id).lean();
    expect(updatedEvent.ticketSolds).to.equal(1);
  });

  // ----------------------------
  // SEATED MODE
  // ----------------------------

  it("SEATED -> 400 if seatIds missing/empty", async () => {
    const token = await loginStudentAndGetToken({ email: "seat1@example.com" });

    const event = await Event.create({
      title: "Seated",
      timezone: "Asia/Thimphu",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000),
      ticketSolds: 0,
      totalTickets: 0,
      status: true,
      meetings: [{ mode: "seated" }],
      seats: [],
    });

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${event._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ seatIds: [] });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("seatIds must be a non-empty array");
  });

  it("SEATED -> 200 books 1 seat, locks seat, increments ticketSolds, creates ticket", async () => {
    const token = await loginStudentAndGetToken({ email: "seat2@example.com" });
    const student = await Student.findOne({
      email: "seat2@example.com",
    }).lean();

    const tt = await TicketType.create({ name: "VIP", price: "100" });

    const event = await Event.create({
      title: "Seated OK",
      timezone: "Asia/Thimphu",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000),
      ticketSolds: 0,
      totalTickets: 0,
      status: true,
      meetings: [{ mode: "seated" }],
      seats: [{ row: "A", columns: "1", ticketTypes: tt._id, isBooked: false }],
    });

    const seatId = event.seats[0]._id.toString();

    const res = await request(app)
      .post(`/api/v1/students/events/registration/${event._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ seatIds: [seatId] });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Processed seat booking request");
    expect(res.body.successCount).to.equal(1);
    expect(res.body.failCount).to.equal(0);
    expect(res.body.totalPrice).to.equal(100);

    const updatedEvent = await Event.findById(event._id).lean();
    expect(updatedEvent.ticketSolds).to.equal(1);

    const updatedSeat = updatedEvent.seats.find(
      (s) => String(s._id) === seatId,
    );
    expect(updatedSeat.isBooked).to.equal(true);

    const ticket = await Ticket.findOne({
      eventId: event._id,
      studentId: student._id,
    }).lean();
    expect(ticket).to.exist;
    expect(ticket.status).to.equal("confirmed");
    expect(ticket.ticketInfo.seatNumber.row).to.equal("A");
    expect(ticket.ticketInfo.seatNumber.columns).to.equal("1");
  });
});
