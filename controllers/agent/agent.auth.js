import Agent from "../../models/agent.js";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "../../utils/jwt.js";
import PendingSignup from "../../models/pendingSignup.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";
import crypto from "crypto";
// Variables for the resend otp
const OTP_EXP_MIN = 5; // expires in 5 mins
const RESEND_COOLDOWN_SEC = 60; // wait 60 sec between resends
const MAX_RESENDS = 5; // max 5 resends per OTP window

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const user = await Agent.findOne({ email }).select(
      "password agency systemRole roleId isVerified name email isActive",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = await signToken({
      id: user._id.toString(), // agent id
      agencyId: user.agency.toString(), // agency id
      email: user.email,
      isVerified: user.isVerified,
    });
    if (!user.isActive) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
        roleId: user.roleId,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      accessToken: token,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// change password similar as the previous ones
// RESET PASSWORD FLOW

// 1. SEND PASSWORD RESET OTP
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();

    const user = await Agent.findOne({ email: normalizedEmail });
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
    const user = await Agent.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    user.isVerified = true; // verifying the new agent when password changes
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("SET NEW PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
