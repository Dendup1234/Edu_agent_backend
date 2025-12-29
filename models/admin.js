import mongoose from "mongoose";

const adminSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    profileUrl: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      role: {
    },
      type: String,
      enum: ["superadmin"],
      default: "superadmin",
    },
  },

  { timestamps: true }
);

export default Admin = mongoose.model("Admin", adminSchema);
