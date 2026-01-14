import mongoose from "mongoose";
const { Schema, Types } = mongoose;

// Custom role schema
const roleSchema = new Schema(
  {
    agencyId: { type: Types.ObjectId, ref: "Agency" },
    name: { type: String },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
