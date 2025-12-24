import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
import { signToken, verifyToken } from "../utils/jwt.js"
import { register } from "module";

// Variables for the resend otp
const OTP_EXP_MIN = 5;        // expires in 5 mins
const RESEND_COOLDOWN_SEC = 60; // wait 60 sec between resends
const MAX_RESENDS = 5;        // max 5 resends per OTP window

//SEND and resend OTP
export const sendOrResendOtp = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });

		const normalizedEmail = email.toLowerCase().trim();

		const existing = await Otp.findOne({ email: normalizedEmail });

		//  if already have an OTP record, apply resend rules
		if (existing) {
			const secondsSinceLast = (Date.now() - existing.lastSentAt.getTime()) / 1000;

			if (secondsSinceLast < RESEND_COOLDOWN_SEC) {
				return res.status(429).json({
					message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SEC - secondsSinceLast)} seconds before resending OTP.`,
				});
			}

			if (existing.resendCount >= MAX_RESENDS) {
				return res.status(429).json({
					message: "Too many OTP requests. Please try again later.",
				});
			}
		}

		//  generate new 4-digit OTP
		const otp = crypto.randomInt(1000, 9999).toString();
		const otpHash = await bcrypt.hash(otp, 10);

		//  upsert: overwrite old OTP so only latest works
		await Otp.findOneAndUpdate(
			{ email: normalizedEmail },
			{
				email: normalizedEmail,
				otpHash,
				expiresAt: new Date(Date.now() + OTP_EXP_MIN * 60 * 1000),
				lastSentAt: new Date(),
				resendCount: existing ? existing.resendCount + 1 : 0,
			},
			{ upsert: true, new: true }
		);

		await sendOtpEmail(normalizedEmail, otp);

		return res.json({
			message: existing ? "OTP resent to email" : "OTP sent to email",
		});
	} catch (error) {
		console.error("SEND/RESEND OTP ERROR:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
	try {
		const { name, email, password, otp } = req.body;

		// 1) validate input
		if (!name || !email || !password || !otp) {
			return res.status(400).json({
				message: "name, email, password, otp are required",
			});
		}

		const normalizedEmail = email.toLowerCase().trim();

		// 2) check user already exists
		const existing = await User.findOne({ email: normalizedEmail });
		if (existing) {
			return res.status(409).json({ message: "Email already registered" });
		}

		// 3) find OTP record
		const record = await Otp.findOne({ email: normalizedEmail, type: "register" });
		if (!record) {
			return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
		}

		// 4) check expiry
		if (record.expiresAt.getTime() < Date.now()) {
			await record.deleteOne();
			return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
		}

		// 5) compare OTP (hashed)
		const valid = await bcrypt.compare(String(otp), record.otpHash);
		if (!valid) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		// 6) OTP is valid → delete it (one-time use)
		await record.deleteOne();

		// 7) hash password + create user
		const hashed = await bcrypt.hash(password, 12);

		const user = await User.create({
			name,
			email: normalizedEmail,
			password: hashed,
			isVerified: true,
		});

		// issue access token
		const token = signToken({
			sub: user._id.toString(),
			email: user.email,
		});

		return res.status(201).json({
			message: "Registered successfully",
			user: { id: user._id, name: user.name, email: user.email },
			accessToken: token,
		});
	} catch (error) {
		console.error("REGISTER WITH OTP ERROR:", error);

		// duplicate key (email)
		if (error.code === 11000) {
			return res.status(409).json({ message: "Email already registered" });
		}

		return res.status(500).json({ message: error.message || "Internal server error" });
	}
};

// Login controller

export const login = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: "email and password are required" });
	}

	// password is select:false so we must explicitly select it
	const user = await User.findOne({ email }).select("+password");
	if (!user) {
		return res.status(401).json({ message: "Invalid email or password" });
	}

	const ok = await bcrypt.compare(password, user.password);
	if (!ok) {
		return res.status(401).json({ message: "Invalid password" });
	}

	const token = await signToken({ sub: user._id.toString(), email: user.email });

	return res.json({
		message: "Logged in successfully",
		user: { id: user._id, name: user.name, email: user.email },
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

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(200).json({ message: "If email exists, OTP sent" }); // prevent enumeration

    const existing = await Otp.findOne({ email: normalizedEmail, type: "reset" });

    // resend rules
    if (existing) {
      const secondsSinceLast = (Date.now() - existing.lastSentAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SEC) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SEC - secondsSinceLast)}s before resending OTP.`,
        });
      }

      if (existing.resendCount >= MAX_RESENDS) {
        return res.status(429).json({ message: "Too many OTP requests. Try later." });
      }
    }

    // generate OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, type: "reset" },
      {
        email: normalizedEmail,
        otpHash,
        type: "reset",
        expiresAt: new Date(Date.now() + OTP_EXP_MIN * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: existing ? existing.resendCount + 1 : 0,
      },
      { upsert: true, new: true }
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
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const normalizedEmail = email.toLowerCase().trim();

    const record = await Otp.findOne({ email: normalizedEmail, type: "reset" });
    if (!record) return res.status(400).json({ message: "OTP not found or expired" });

    if (record.expiresAt.getTime() < Date.now()) {
      await record.deleteOne();
      return res.status(400).json({ message: "OTP expired. Request a new one." });
    }

    const valid = await bcrypt.compare(String(otp), record.otpHash);
    if (!valid) return res.status(400).json({ message: "Invalid OTP" });

    // OTP valid → delete record
    await record.deleteOne();

    // issue short-lived reset token
    const resetToken = signToken(
      { sub: normalizedEmail },
      { expiresIn: "10m" }
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
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    // verify token
    let decoded;
    try {
      decoded = verifyToken(resetToken);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const email = decoded.sub;
    const user = await User.findOne({ email });
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
