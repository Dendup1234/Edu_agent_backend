import mongoose,{Types} from "mongoose";


const StudentSchema = new Schema(
  {
    email: {
      type: String
    },

    phone: {
      type: String,
      trim: true
    },

    password: {
      type: String,
      select: false
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    googleId: {
      type: String
    },

    name: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    dob: { 
      type: Date 
    },

    nationality: { 
      type: String, 
      trim: true 
    },
    
    education: [
        {
          qualification: { type: String, trim: true },
          institute: { type: String, trim: true },
          year: { type: Number },
          startedAt: {type: Date},
          endedAt:{type: Date}
        },
      ],
    // Student can attend multiple event
    tickets:[{
      type: Types.ObjectId,
      ref: 'Ticket'
    }
    ]
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", StudentSchema);
