import mongoose from "mongoose";
const {Schema,Types} = mongoose;

const agencySchema = new Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      minlength: 8
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
     logo: {
      type: String,
      trim: true,
    },
    servicesOffered: {
      type: [String],
      default: []
    },
    address: {
      type: String,
      trim: true
    },
    about: {
      type: String,
      trim: true
    },
    process: {
      type: [String],
      default: []
    },
    contactInfo: {
        type: String,
        trim: true
    },
    partnerUniversities: [
      {
        type: Types.ObjectId,
        ref: "University"
      }
    ],
    studentsRegistered: [
      { 
        type: Types.ObjectId, 
        ref: "Student" 
      }
    ],

  },
  { timestamps: true}
);

export const Agency = mongoose.model('Agency',agencySchema);