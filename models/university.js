import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    websiteURL: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    about: {
      type: String,
      trim: true,
    },
    mission:{
        type: String,
        trim: true
    },
    status:{
        type: String,
        enum:["Active","Inactive"],
        default: "Active"
    }
  },
  {
    timestamps: true, 
  }
);

export const University = mongoose.Schema('University',universitySchema);