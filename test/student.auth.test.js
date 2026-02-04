import request from "supertest";
import { expect } from "chai";
import esmock from "esmock";
import bcrypt from "bcryptjs";
import app from "../test.js";
import { before, after, beforeEach, describe, it } from "mocha";
import { connectTestDB, clearTestDB, closeTestDB } from "./setup.db.js";

import Student from "../models/student.js";
import PendingSignup from "../models/pendingSignup.js";

describe("Auth OTP + Login + Reset Flow", () => {
  //intial setup
  before(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  after(async () => {
    await closeTestDB();
  });

  // ---------------------------
  // SEND OTP
  // ---------------------------

  // test case 1
  it("POST /api/v1/students/send-otp -> 400 if missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/students/send-otp")
      .send({ email: "a@b.com" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("required");
  });

  //test case 2
  it("POST /api/v1/students/send-otp -> 409 if email already registered", async () => {
    await Student.create({
      name: "Test",
      email: "test@example.com",
      password: await bcrypt.hash("123456", 12),
    });

    const res = await request(app).post("/api/v1/students/send-otp").send({
      name: "X",
      email: "test@example.com",
      password: "123456",
    });

    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal("Email already registered");
  });
  // test case 3
  it("POST /api/v1/students/send-otp -> 200 creates PendingSignup and sends OTP", async () => {
    // If your controller sends real email, your tests may hang/fail.
    // In that case, we recommend mocking sendOtpEmail via esmock in the route/controller import.
    // If your sendOtpEmail is already safe (no network in test), this passes as-is.
    const res = await request(app).post("/api/v1/students/send-otp").send({
      name: "A",
      phone: "123",
      email: "new@example.com",
      password: "123456",
    });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("OTP sent to email");

    const pending = await PendingSignup.findOne({ email: "new@example.com" });
    expect(pending).to.exist;
    expect(pending.type).to.equal("register");
    expect(pending.otpHash).to.be.a("string");
  });

  // ---------------------------
  // RESEND OTP
  // ---------------------------

  //test case 4
  it("POST /api/v1/students/resend-otp -> 404 if no pending signup", async () => {
    const res = await request(app)
      .post("/api/v1/students/resend-otp")
      .send({ email: "nope@example.com" });

    expect(res.status).to.equal(404);
    expect(res.body.message).to.include("No pending signup");
  });

  // ---------------------------
  // VERIFY OTP
  // ---------------------------

  //test case 5
  it("POST /api/v1/students/verify-otp -> 400 invalid OTP", async () => {
    // create pending signup record manually with known OTP hash
    const otp = "1111";
    const otpHash = await bcrypt.hash(otp, 10);

    await PendingSignup.create({
      email: "v@example.com",
      name: "V",
      phone: "1",
      passwordHash: await bcrypt.hash("123456", 12),
      otpHash,
      type: "register",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      resendCount: 0,
      verified: false,
    });

    const res = await request(app).post("/api/v1/students/verify-otp").send({
      email: "v@example.com",
      otp: "9999",
    });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid OTP");
  });

  // test case 6
  it("POST /api/v1/students/verify-otp -> 201 creates Student and returns token", async () => {
    const otp = "2222";
    const otpHash = await bcrypt.hash(otp, 10);

    await PendingSignup.create({
      email: "ok@example.com",
      name: "OK",
      phone: "9",
      passwordHash: await bcrypt.hash("123456", 12),
      otpHash,
      type: "register",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      resendCount: 0,
      verified: false,
    });

    const res = await request(app).post("/api/v1/students/verify-otp").send({
      email: "ok@example.com",
      otp: "2222",
    });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("accessToken");
    expect(res.body.user.email).to.equal("ok@example.com");

    const created = await Student.findOne({ email: "ok@example.com" });
    expect(created).to.exist;

    const pending = await PendingSignup.findOne({ email: "ok@example.com" });
    expect(pending).to.not.exist; // cleaned up
  });

  // ---------------------------
  // LOGIN
  // ---------------------------

  //test case 7
  it("POST /api/v1/students/login -> 401 invalid email", async () => {
    const res = await request(app).post("/api/v1/students/login").send({
      email: "missing@example.com",
      password: "123456",
    });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.include("Invalid");
  });

  //test case 8
  it("POST /api/v1/students/login -> 200 valid login returns token", async () => {
    await Student.create({
      name: "User",
      email: "login@example.com",
      password: await bcrypt.hash("123456", 12),
    });

    const res = await request(app).post("/api/v1/students/login").send({
      email: "login@example.com",
      password: "123456",
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("accessToken");
    expect(res.body.user.email).to.equal("login@example.com");
  });

  // ---------------------------
  // RESET PASSWORD FLOW

  // -----------------------------
  // 1) SEND RESET OTP
  // -----------------------------
  it("POST /password-reset/send-otp -> 400 if email missing", async () => {
    const res = await request(app)
      .post("/api/v1/students/password-reset/send-otp")
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Email is required");
  });

  it("POST /password-reset/send-otp -> 200 even if user doesn't exist (anti-enumeration)", async () => {
    const res = await request(app)
      .post("/api/v1/students/password-reset/send-otp")
      .send({ email: "unknown@example.com" });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.include("If email exists");
  });

  it("POST /password-reset/send-otp -> 200 creates/reset PendingSignup record when user exists", async () => {
    await Student.create({
      name: "Reset User",
      email: "reset@example.com",
      password: await bcrypt.hash("OldPass123", 12),
    });

    const res = await request(app)
      .post("/api/v1/students/password-reset/send-otp")
      .send({ email: "reset@example.com" });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.include("If email exists");

    const pending = await PendingSignup.findOne({
      email: "reset@example.com",
      type: "reset",
    });

    expect(pending).to.exist;
    expect(pending.otpHash).to.be.a("string");
    expect(pending.expiresAt).to.be.instanceOf(Date);
  });

  // -----------------------------
  // 2) VERIFY RESET OTP
  // -----------------------------
  it("POST /password-reset/verify-otp -> 400 if missing email/otp", async () => {
    const res = await request(app)
      .post("/api/v1/students/password-reset/verify-otp")
      .send({ email: "x@example.com" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Email and OTP are required");
  });

  it("POST /password-reset/verify-otp -> 400 if record not found", async () => {
    const res = await request(app)
      .post("/api/v1/students/password-reset/verify-otp")
      .send({ email: "missing@example.com", otp: "1111" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("OTP not found or expired");
  });

  it("POST /password-reset/verify-otp -> 400 if OTP expired (and deletes record)", async () => {
    const otpHash = await bcrypt.hash("1234", 10);

    await PendingSignup.create({
      email: "exp@example.com",
      type: "reset",
      otpHash,
      expiresAt: new Date(Date.now() - 60 * 1000), // expired
      lastSentAt: new Date(Date.now() - 120 * 1000),
      resendCount: 0,
    });

    const res = await request(app)
      .post("/api/v1/students/password-reset/verify-otp")
      .send({ email: "exp@example.com", otp: "1234" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("OTP expired");

    const stillThere = await PendingSignup.findOne({
      email: "exp@example.com",
      type: "reset",
    });
    expect(stillThere).to.not.exist;
  });

  it("POST /password-reset/verify-otp -> 400 if OTP invalid", async () => {
    const otpHash = await bcrypt.hash("2222", 10);

    await PendingSignup.create({
      email: "inv@example.com",
      type: "reset",
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      resendCount: 0,
    });

    const res = await request(app)
      .post("/api/v1/students/password-reset/verify-otp")
      .send({ email: "inv@example.com", otp: "9999" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid OTP");
  });

  it("POST /password-reset/verify-otp -> 200 returns resetToken and deletes record", async () => {
    const otpHash = await bcrypt.hash("4444", 10);

    await PendingSignup.create({
      email: "ok@example.com",
      type: "reset",
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      resendCount: 0,
    });

    const res = await request(app)
      .post("/api/v1/students/password-reset/verify-otp")
      .send({ email: "ok@example.com", otp: "4444" });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("OTP verified");
    expect(res.body).to.have.property("resetToken");
    expect(res.body.resetToken).to.be.a("string");

    const stillThere = await PendingSignup.findOne({
      email: "ok@example.com",
      type: "reset",
    });
    expect(stillThere).to.not.exist;
  });

  // -----------------------------
  // 3) SET NEW PASSWORD
  // -----------------------------
  it("POST /password-reset/set-new-password -> 400 if missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/students/password-reset/set-new")
      .send({ resetToken: "x" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("required");
  });

  it("POST /password-reset/set-new-password -> 400 if reset token invalid", async () => {
    const res = await request(app)
      .post("/api/v1/students/password-reset/set-new")
      .send({ resetToken: "invalid.token.here", newPassword: "NewPass123" });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("Invalid or expired reset token");
  });

  it("POST /password-reset/set-new-password -> 200 changes password when token valid", async () => {
    // Create user
    await Student.create({
      name: "Reset Me",
      email: "resetme@example.com",
      password: await bcrypt.hash("OldPass123", 12),
    });

    // Create OTP record
    const otpHash = await bcrypt.hash("7777", 10);
    await PendingSignup.create({
      email: "resetme@example.com",
      type: "reset",
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      resendCount: 0,
    });

    // Verify OTP to get reset token
    const verifyRes = await request(app)
      .post("/api/v1/students/password-reset/verify-otp")
      .send({ email: "resetme@example.com", otp: "7777" });

    expect(verifyRes.status).to.equal(200);
    const resetToken = verifyRes.body.resetToken;

    // Set new password
    const setRes = await request(app)
      .post("/api/v1/students/password-reset/set-new")
      .send({ resetToken, newPassword: "NewPass123" });

    expect(setRes.status).to.equal(200);
    expect(setRes.body.message).to.equal("Password reset successful");

    // Confirm password changed in DB
    const user = await Student.findOne({ email: "resetme@example.com" }).select(
      "+password",
    );
    const ok = await bcrypt.compare("NewPass123", user.password);
    expect(ok).to.equal(true);
  });
});
