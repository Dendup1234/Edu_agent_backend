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
  eligiblility: {
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
    enum: ["open", "closed", "upcoming"],
  },
  providedBy: {
    type: Types.ObjectId,
    ref: "University",
  },
});

export default mongoose.model("Scholarship", scholarshipSchema);
