import mongoose, { Schema } from "mongoose";

const CourseSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },

		//Course provided by the university
		university: {
			type: Schema.Types.ObjectId,
			ref: "University",
			required: true
		},
		//level of the courses
		level: {
			type: String,
			enum: ["undergraduate", "graduate", "diploma", "phd"],
		},
		//About field
		about: {
			type: String,

		},
		duration: {
			type: String
		},
		tuitionFee: {
			type: Number,
			min: 0,
			currency: {
				type: String,
			}
		},
		description: {
			type: String
		},
		entryRequirements: {
			type: [String]
		},
		documentRequirements: {
			type: [String]
		},
		status: {
			type: String,
			enum: ["open", "closed"],
			default: "open"
		},
		// Max number of student in the courses
		intakes: {
			type: Number,
			min: 0

		},
	},
	{ timestamps: true }
);

export default mongoose.model("Course", CourseSchema);

//Course Registered Schema
const courseRegistrationSchema = new mongoose.Schema({
	studentid: {
		type: Schema.Types.ObjectId,
		ref: "Student",
		required: true
	},
	courseid: {
		type: Types.ObjectId(),
		ref: "Course",
		required: true
	},
	status: {
		type: String,
		enum: ["saved", "registered", "cancelled", "completed"]
	},
	registeredAt: {
		type: Date,
		default: Date.now()
	},
});

//Exporting the model schema
export const CourseRegistered = mongoose.model("CourseRegistered", courseRegistrationSchema);
