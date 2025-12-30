import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    email: { 
      type: String },
    name: { 
      type: String },
    phone:{
      type:String
    },
    organizationName:{
      type: String,
    },
    // Store hashed password (never plain text)
    passwordHash: { type: String },

    otpHash: { type: String },
    expiresAt: { type: Date },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    type: { type: String, enum: ["register", "reset"], required: true },

    // optional: anti-abuse tracking
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto delete expired docs (MongoDB TTL index)
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingSignup", pendingSignupSchema);
