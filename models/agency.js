import mongoose, { Schema, Types } from "mongoose";

const agencySchema = new Schema(
  {
    organizationName: {
      type: String,
    },

    email: {
      type: String,
    },
    name: {
      type: String,
    },

    password: {
      type: String,
      minlength: 8,
    },

    googleId: {
      type: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    logo: {
      type: String,
      trim: true,
    },

    servicesOffered: {
      type: [String],
      default: [],
    },
    establishment: {
      type: String,
    },

    address: {
      type: String,
      trim: true,
    },

    about: {
      type: String,
      trim: true,
    },

    process: {
      type: [String],
      default: [],
    },

    contactInfo: {
      type: String,
      trim: true,
    },

    partnerUniversities: [
      {
        type: Types.ObjectId,
        ref: "University",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Agency", agencySchema);
