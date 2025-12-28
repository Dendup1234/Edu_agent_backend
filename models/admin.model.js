import mongoose from "mongoose";

const { Schema, Types } = mongoose;

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
    },
    role: {
      type: String,
      enum: ["superadmin"],
      default: "superadmin",
    },
    //Writing a permission such as read and write or only read access by the admin
    permissions: {
      type: [String],
      // blank for superadmin where there is no permission retriction
      default: [],
    },
  },

  { timestamps: true }
);

export default Admin = mongoose.model("Admin", adminSchema);
