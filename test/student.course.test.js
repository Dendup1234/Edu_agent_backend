// test/student.course.routes.spec.js
import request from "supertest";
import { expect } from "chai";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import app from "../test.js";
import { before, after, beforeEach, describe, it } from "mocha";
import { connectTestDB, clearTestDB, closeTestDB } from "./setup.db.js";

import Student from "../models/student.js";
import Course from "../models/course.js";
import University from "../models/university.js";

describe("Student Courses Routes", () => {
  before(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  after(async () => {
    await closeTestDB();
  });

  const seedStudentAndLogin = async ({
    email = "student@example.com",
    password = "123456",
    registeredAgency = null,
  } = {}) => {
    const student = await Student.create({
      name: "Student",
      email,
      password: await bcrypt.hash(password, 12),
      registeredAgency,
      selectedCourse: null,
      selectedUniversity: null,
    });

    const loginRes = await request(app).post("/api/v1/students/login").send({
      email,
      password,
    });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.have.property("accessToken");

    return {
      token: loginRes.body.accessToken,
      student,
    };
  };

  // -------------------------
  // GET /api/v1/students/courses
  // -------------------------

  it("GET /api/v1/students/courses -> 401 if no token", async () => {
    const res = await request(app).get("/api/v1/students/courses");
    expect(res.status).to.equal(401);
  });

  it("GET /api/v1/students/courses -> 200 returns only open courses for student's registeredAgency", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({
      email: "agency@example.com",
      registeredAgency: agencyId,
    });

    const uni = await University.create({ name: "Agency Uni" });

    await Course.create([
      {
        title: "Open A",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
      {
        title: "Open B",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
      {
        title: "Closed C",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "closed",
      },
      {
        title: "Other Agency Open",
        createdBy: new mongoose.Types.ObjectId(),
        providedBy: uni._id,
        status: "open",
      },
    ]);

    const res = await request(app)
      .get("/api/v1/students/courses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Course extracted successfully");
    expect(res.body.courses).to.be.an("array");

    const titles = res.body.courses.map((c) => c.title);
    expect(titles).to.include("Open A");
    expect(titles).to.include("Open B");
    expect(titles).to.not.include("Closed C");
    expect(titles).to.not.include("Other Agency Open");
  });

  // -------------------------
  // GET /api/v1/students/courses/search?q=...
  // -------------------------

  it("GET /api/v1/students/courses/search -> 401 if no token", async () => {
    const res = await request(app).get("/api/v1/students/courses/search?q=it");
    expect(res.status).to.equal(401);
  });

  it("GET /api/v1/students/courses/search -> 400 if q missing", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({ registeredAgency: agencyId });

    const res = await request(app)
      .get("/api/v1/students/courses/search")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("q");
  });

  it("GET /api/v1/students/courses/search -> 400 if student's registeredAgency is missing/invalid", async () => {
    const { token } = await seedStudentAndLogin({ registeredAgency: null });

    const res = await request(app)
      .get("/api/v1/students/courses/search?q=it")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid agencyId");
  });

  it("GET /api/v1/students/courses/search -> 200 returns matched courses (case-insensitive) for student's registeredAgency", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({
      email: "search@example.com",
      registeredAgency: agencyId,
    });

    const uni = await University.create({ name: "Search Uni" });

    await Course.create([
      {
        title: "Bachelor of Information Technology",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
      {
        title: "Information Systems",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
      {
        title: "Diploma of Nursing",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
      {
        title: "Information Tech (Other Agency)",
        createdBy: new mongoose.Types.ObjectId(),
        providedBy: uni._id,
        status: "open",
      },
    ]);

    const res = await request(app)
      .get("/api/v1/students/courses/search?q=information")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Success");
    expect(res.body.course).to.be.an("array");
    expect(res.body.count).to.equal(res.body.course.length);

    const titles = res.body.course.map((c) => c.title);
    expect(titles).to.include("Bachelor of Information Technology");
    expect(titles).to.include("Information Systems");
    expect(titles).to.not.include("Diploma of Nursing");
    expect(titles).to.not.include("Information Tech (Other Agency)");
  });

  it("GET /api/v1/students/courses/search -> 200 safely handles regex input like C++", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({
      email: "regex@example.com",
      registeredAgency: agencyId,
    });

    const uni = await University.create({ name: "Regex Uni" });

    await Course.create([
      {
        title: "C++ Programming",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
      {
        title: "C# Programming",
        createdBy: agencyId,
        providedBy: uni._id,
        status: "open",
      },
    ]);

    const res = await request(app)
      .get("/api/v1/students/courses/search?q=C++")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Success");

    const titles = res.body.course.map((c) => c.title);
    expect(titles).to.include("C++ Programming");
  });

  // -------------------------
  // PATCH /api/v1/students/courses/select/:courseId
  // -------------------------

  it("PATCH /api/v1/students/courses/select/:courseId -> 401 if no token", async () => {
    const res = await request(app).patch(
      `/api/v1/students/courses/select/${new mongoose.Types.ObjectId().toString()}`,
    );
    expect(res.status).to.equal(401);
  });

  it("PATCH /api/v1/students/courses/select/:courseId -> 400 if invalid courseId", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({ registeredAgency: agencyId });

    const res = await request(app)
      .patch("/api/v1/students/courses/select/not-an-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid courseId");
  });

  it("PATCH /api/v1/students/courses/select/:courseId -> 404 if course not found", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({ registeredAgency: agencyId });

    const res = await request(app)
      .patch(
        `/api/v1/students/courses/select/${new mongoose.Types.ObjectId().toString()}`,
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal("Course not found");
  });

  it("PATCH /api/v1/students/courses/select/:courseId -> 400 if course has no university attached", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token } = await seedStudentAndLogin({ registeredAgency: agencyId });

    const course = await Course.create({
      title: "No Uni Course",
      createdBy: agencyId,
      // providedBy omitted
      status: "open",
    });

    const res = await request(app)
      .patch(`/api/v1/students/courses/select/${course._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Course has no university attached");
  });

  it("PATCH /api/v1/students/courses/select/:courseId -> 200 selects course + university first time", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const { token, student } = await seedStudentAndLogin({
      email: "select1@example.com",
      registeredAgency: agencyId,
    });

    const uni = await University.create({ name: "Select Uni" });
    const course = await Course.create({
      title: "Selectable Course",
      createdBy: agencyId,
      providedBy: uni._id,
      status: "open",
    });

    const res = await request(app)
      .patch(`/api/v1/students/courses/select/${course._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Success");

    const updated = await Student.findById(student._id).lean();
    expect(String(updated.selectedCourse)).to.equal(String(course._id));
    expect(String(updated.selectedUniversity)).to.equal(String(uni._id));
  });

  it("PATCH /api/v1/students/courses/select/:courseId -> 409 if already selected a course", async () => {
    const agencyId = new mongoose.Types.ObjectId();
    const uni = await University.create({ name: "Existing Uni" });

    const existingCourse = await Course.create({
      title: "Existing Course",
      createdBy: agencyId,
      providedBy: uni._id,
      status: "open",
    });

    const { token, student } = await seedStudentAndLogin({
      email: "select2@example.com",
      registeredAgency: agencyId,
    });

    await Student.findByIdAndUpdate(student._id, {
      selectedCourse: existingCourse._id,
      selectedUniversity: uni._id,
    });

    const newUni = await University.create({ name: "New Uni" });
    const newCourse = await Course.create({
      title: "New Course",
      createdBy: agencyId,
      providedBy: newUni._id,
      status: "open",
    });

    const res = await request(app)
      .patch(`/api/v1/students/courses/select/${newCourse._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal("You already selected a course");
  });
});
