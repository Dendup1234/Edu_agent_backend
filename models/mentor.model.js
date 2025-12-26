import mongoose, { Schema } from "mongoose";

//Creating a mentor auth model

const mentorSchema = mongoose.Schema({
    name:{
        type: String
    },
    phone:{
        type:Number
    },
     email:{
        type: String,
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
        select: false,
    },
     profilepic:{
        type: String
    },
    status:{
        type: String,
        enum:['Active','Inactive'],
        default: 'Active'
    },
    experiences:{
        type: [String]
    },
    education:{
        type: [String],
    },
    availability:{
        type: [String]
    },
    rating:{
        type: Number,
        min:0,
        max:5,
    },
    joinDate:{
        type: Date,
    },
    lastActivity:{
        type: Date,
    },

    isActive:{
        type: Boolean,
        default: true
    },
},
{timestamp: true}
);

// exporting the mentor auth model
export const Mentor = mongoose.model('Mentor',mentorSchema);

//Creating a mentor connection schema

const mentorConnectionSchema = new mongoose.Schema({
    studentId: { 
        type: Schema.Types.ObjectId, 
        ref: "Student", 
        required: true, 
        
     },
    mentorId: { 
        type: Schema.Types.ObjectId, 
        ref: "Mentor", 
        required: true, 
         
    },
    status: {
      type: String,
      enum: ["Pending","Approved","Rejected"],
      default: "Pending",
      
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
},
{timestamps: true}
);

export const MentorConnection = mongoose.model('MentorConnection',mentorConnectionSchema)

//Mentor Appointment Schema
const appointmentSchema = mongoose.Schema({
    mentorId: {
        type: Schema.Types.ObjectId,
        ref: "Mentor",
        required: true,
    },
    studentId: { 
        type: Schema.Types.ObjectId, 
        ref: "Student", 
        required: true 
    },
    time:{
        type: Date
    },
    date:{
        type: Date
    },
    mode:{
        type: String,
        enum:['Zoom','In-person']
    },
    status:{
        type: String,
        enum:['Scheduled','Tentative']
    },
    purpose:{
        type: String
    }
});

export const Appointment = mongoose.model('Appointment',appointmentSchema);



