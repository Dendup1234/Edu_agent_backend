import mongoose, { Schema, Types } from "mongoose";

const transactionSchema = new Schema({
  date: {
    type: Date,
  },
  amount: {
    type: Number,
    default: 0,
  },
  categoryId: {
    type: Types.ObjectId,
    ref: "Category",
  },
  accountId: {
    type: Types.ObjectId,
    ref: "Accounts",
  },
  descriptions: {
    type: String,
  },
  notes: {
    type: String,
  },
});

export default mongoose.model("Transaction", transactionSchema);
