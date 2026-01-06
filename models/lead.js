import mongoose, {Schema,Types} from "mongoose";

const LeadSchema = new Schema(
  {
    student: {
      type: Types.ObjectId,
      ref: "Student",
      required: true,
    },

    agency: {
      type: Types.ObjectId,
      ref: "Agency",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "negotiated",
        "applied",
        "converted",
        "lost",
      ],
      default: "new",
    },

    assignedTo: {
      type: Types.ObjectId,
      ref: "Agent",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Lead", LeadSchema);
