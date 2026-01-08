import mongoose, { Schema, Types } from "mongoose";

const scholarshipSchema = new Schema({
  title: {
    type: String,
  },
  about: {
    type: String,
  },
  howToApply: {
    type: String,
  },
  amount: {
    type: String,
  },
  eligibility: {
    type: String,
  },
  fieldOfStudy: {
    type: [String],
  },
  applicationDateline: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["open", "closed"],
  },
  // other source
  providedBy: {
    name: {
      type: String,
    },
    logoUrl: {
      type: String,
    },
  },
  // Created by the agency
  createdBy: {
    type: Types.ObjectId,
    ref: "Agency",
  },
});

export default mongoose.model("Scholarship", scholarshipSchema);
