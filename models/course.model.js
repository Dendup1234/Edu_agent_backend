import mongoose, { Schema } from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    university: {
      type: Schema.Types.ObjectId,
      ref: "University",
      required: true
    },
    
    level: {
      type: String,
      enum: ["undergraduate", "graduate", "diploma", "phd"],
    },
  
    about:{
        type: String,

    },
    duration: { 
        type: String 
    }, 
    tuitionFee: { 
        type: Number,
        min: 0,
        currency:{
            type: String,
        }   
    },
    description: { 
        type: String 
    },
    entryRequirements: {
      type: [String]
    },
    documentRequirements:{
        type:[String]
    },
    status:{
        type: String,
        enum:["open","closed"],
        default: "open"
    },
    intakes: { 
        type: [String] 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
