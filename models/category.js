import mongoose, { Schema, Types } from "mongoose";

const categorySchema = new Schema({
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ["Expenses", "Income", "Savings"],
  },
});

export default mongoose.model;
