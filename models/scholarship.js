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
  providedBy: {
    type: Types.ObjectId,
    ref: "University",
  },
});

export default mongoose.model("Scholarship", scholarshipSchema);
