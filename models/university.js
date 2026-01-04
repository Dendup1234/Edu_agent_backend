import mongoose, { Schema } from "mongoose";

const universitySchema = new Schema(
  {
    name: {
      type: String,
    },
    logo: {
      type: String,
    },
    websiteURL: {
      type: String,
    },
    country: {
      type: String,
    },
    about: {
      type: String,
    },
    mission: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("University", universitySchema);
