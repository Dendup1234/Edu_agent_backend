import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOtpEmail } from "../../utils/sendEmail.js";
import { signToken, verifyToken } from "../../utils/jwt.js";
import PendingSignup from "../../models/pendingSignup.js";
import Agency from "../../models/agency.js";

// Variables for the resend otp
const OTP_EXP_MIN = 5; // expires in 5 mins
const RESEND_COOLDOWN_SEC = 60; // wait 60 sec between resends
const MAX_RESENDS = 5; // max 5 resends per OTP window

//SEND and resend OTP
export const sendOtp = async (req, res) => {
  try {
    // Request body
    const { name, phone, organizationName, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // If already registered, stop
    const existingUser = await Agency.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(409).json({ message: "Email already registered" });

    // If already pending, treat as resend (force them to use resend endpoint)
    const pending = await PendingSignup.findOne({
      email: normalizedEmail,
      type: "register",
    });
    if (pending) {
      return res.status(409).json({
        message: "OTP already sent please wait 5 min to token to expire",
      });
    }

    // otp generation
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(password, 12);

    //Creating temporary user
    await PendingSignup.create({
      email: normalizedEmail,
      name,
      phone,
      organizationName,
      passwordHash,
      otpHash,
      type: "register",
      expiresAt: new Date(Date.now() + OTP_EXP_MIN * 60 * 1000), // pandingsignup otp get expired at 5 mins
      lastSentAt: new Date(),
      resendCount: 0,
      verified: false,
    });

    await sendOtpEmail(normalizedEmail, otp);

    return res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//resend otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // If already registered, stop
    const existingUser = await Agency.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(409).json({ message: "Email already registered" });

    const pending = await PendingSignup.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({
        message: "No pending signup found. Please sign up again.",
      });
    }

    // resend rules
    const secondsSinceLast = (Date.now() - pending.lastSentAt.getTime()) / 1000;

    if (secondsSinceLast < RESEND_COOLDOWN_SEC) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil(
          RESEND_COOLDOWN_SEC - secondsSinceLast,
        )} seconds before resending OTP.`,
      });
    }

    if (pending.resendCount >= MAX_RESENDS) {
      return res.status(429).json({
        message: "Too many OTP requests. Please try again later.",
      });
    }

    const otp = crypto.randomInt(1000, 9999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // update pending signup (keep name/passwordHash from existing)
    pending.otpHash = otpHash;
    pending.expiresAt = new Date(Date.now() + OTP_EXP_MIN * 60 * 1000);
    pending.lastSentAt = new Date();
    pending.resendCount = pending.resendCount + 1;
    pending.verified = false;

    await pending.save();

    await sendOtpEmail(normalizedEmail, otp);

    return res.json({ message: "OTP resent to email" });
  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "email and otp are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // already registered?
    const existing = await Agency.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    // get pending signup
    const pending = await PendingSignup.findOne({ email: normalizedEmail });
    if (!pending)
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new OTP." });

    // expiry
    if (pending.expiresAt.getTime() < Date.now()) {
      await pending.deleteOne();
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new OTP." });
    }

    // verify otp
    const valid = await bcrypt.compare(String(otp), pending.otpHash);
    if (!valid) return res.status(400).json({ message: "Invalid OTP" });

    // create user from pending data
    const user = await Agency.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      organizationName: pending.organizationName,
      password: pending.passwordHash,
      isVerified: true,
    });

    // cleanup pending
    await pending.deleteOne();

    // token
    const token = await signToken({
      agencyId: user._id.toString(),
      email: user.email,
      actor: "Agency",
    });

    return res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      accessToken: token,
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

// Login controller

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  // password is select:false so we must explicitly select it
  const user = await Agency.findOne({ email }).select("password");
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = await signToken({
    agencyId: user._id.toString(),
    email: user.email,
    actor: "Agency",
  });

  return res.json({
    message: "Logged in successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    accessToken: token,
  });
};

// RESET PASSWORD FLOW

// 1. SEND PASSWORD RESET OTP
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();

    const user = await Agency.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(200).json({ message: "If email exists, OTP sent" }); // prevent enumeration

    const existing = await PendingSignup.findOne({
      email: normalizedEmail,
      type: "reset",
    });

    // resend rules
    if (existing) {
      const secondsSinceLast =
        (Date.now() - existing.lastSentAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SEC) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(
            RESEND_COOLDOWN_SEC - secondsSinceLast,
          )}s before resending OTP.`,
        });
      }

      if (existing.resendCount >= MAX_RESENDS) {
        return res
          .status(429)
          .json({ message: "Too many OTP requests. Try later." });
      }
    }

    // generate OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await PendingSignup.findOneAndUpdate(
      { email: normalizedEmail, type: "reset" },
      {
        email: normalizedEmail,
        otpHash,
        type: "reset",
        expiresAt: new Date(Date.now() + OTP_EXP_MIN * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: existing ? existing.resendCount + 1 : 0,
      },
      { upsert: true, new: true },
    );

    await sendOtpEmail(normalizedEmail, otp, "Password Reset OTP");

    return res.json({ message: "If email exists, OTP sent" });
  } catch (error) {
    console.error("SEND PASSWORD RESET OTP ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 2. VERIFY PASSWORD RESET OTP
export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const normalizedEmail = email.toLowerCase().trim();

    const record = await PendingSignup.findOne({
      email: normalizedEmail,
      type: "reset",
    });
    if (!record)
      return res.status(400).json({ message: "OTP not found or expired" });

    if (record.expiresAt.getTime() < Date.now()) {
      await record.deleteOne();
      return res
        .status(400)
        .json({ message: "OTP expired. Request a new one." });
    }

    const valid = await bcrypt.compare(String(otp), record.otpHash);
    if (!valid) return res.status(400).json({ message: "Invalid OTP" });

    // OTP valid → delete record
    await record.deleteOne();

    // issue short-lived reset token
    const resetToken = signToken(
      { sub: normalizedEmail },
      { expiresIn: "10m" },
    );

    return res.json({ message: "OTP verified", resetToken });
  } catch (error) {
    console.error("VERIFY PASSWORD RESET OTP ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 3. SET NEW PASSWORD
export const setNewPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Reset token and new password are required" });
    }

    // verify token
    let decoded;
    try {
      decoded = verifyToken(resetToken);
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const email = decoded.sub;
    const user = await Agency.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("SET NEW PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
