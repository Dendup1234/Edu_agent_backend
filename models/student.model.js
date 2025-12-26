import mongoose from "mongoose";
const { Schema } = mongoose;

const StudentSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    name: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    dob: { type: Date },
    nationality: { type: String, trim: true },
    
    education: [
        {
          qualification: { type: String, trim: true },
          institute: { type: String, trim: true },
          year: { type: Number },
        },
      ],
    lastActiveAt: { type: Date, index: true },
  },
  { timestamps: true }
);


export const Student = mongoose.model("Student", StudentSchema);
