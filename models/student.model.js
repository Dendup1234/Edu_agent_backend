import mongoose from "mongoose";

//Creating the student schema for the auth
const studentSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
        type:String,
        trim: true, 
        index: true, 
        sparse: true 
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
        select: false,
    },
    isActive:{
        type: Boolean,
        default: true
    },
},
{timestamps:true}
);

studentSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
studentSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });

export const Student = mongoose.model("Student",studentSchema);

//For the student profile
const studentProfile = new mongoose.Schema({
    userid:{
        type: Types.ObjectId,
        ref: "Student",
        required: true,
        unique: true, 
        index: true
    },
    dob: { 
        type: Date 
    },
    nationality: { 
        type: String, trim: true 
    },
    education:[
        {
            qualification:{
                type:String,
                trim: true
            },
            institude:{
                type: String,
                trim: true
            },
            year:{
                type: Number
            },
        }
    ]
},
{timestamp: true}
);

export const StudentProfile = mongoose.model("StudentProfile",studentProfile);

