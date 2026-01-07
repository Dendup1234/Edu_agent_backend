import mongoose, { Schema, Types } from "mongoose";

const accountSchema = new Schema({
  name: {
    type: String,
  },
  paymentType: {
    type: String,
    enum: ["Cash", "Bank", "Credit Card"],
  },
});

export default mongoose.model("Account", accountSchema);
