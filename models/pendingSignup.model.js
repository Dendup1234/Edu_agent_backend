import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },

    // Store hashed password (never plain text)
    passwordHash: { type: String, required: true },

    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },

    // optional: anti-abuse tracking
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Auto delete expired docs (MongoDB TTL index)
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingSignup", pendingSignupSchema);
