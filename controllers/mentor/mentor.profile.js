import Mentor from "../../models/mentor.js";
import {
  sendMenteeEmail,
  sendAppointmentEmail,
} from "../../utils/sendEmail.js";
import Appointment from "../../models/appointment.js";
import Student from "../../models/student.js";
import { sendStudentPushNotification } from "../../utils/notification.js";
import Message from "../../models/message.js";
import Conversation from "../../models/conversation.js";

// Getting the profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    // getting the mentor profile
    const mentor = await Mentor.findById(userId);

    //Success message
    return res.status(200).json({ message: "Success", mentor: mentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Updating the profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    const update = req.body;
    // updating the profile of the mentor
    const updatedMentor = await Mentor.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password");
    return res.status(200).json({ message: "Success", mentor: updatedMentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
// Getting the student pending status
export const getStudentPending = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    const mentor = await Mentor.findById(userId).populate({
      path: "mentees.student",
      select:
        "name email phone profileUrl nationality selectedUniversity selectedCourse",
      populate: [
        { path: "selectedUniversity", select: "name country profileUrl websiteURL" },
        { path: "selectedCourse", select: "title level duration intake fee" },
      ],
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    // Only the pending  mentees are shown
    const confirmedMentees = mentor.mentees.filter(
      (m) => m.status === "pending" && m.student,
    );

    return res.status(200).json({
      message: "Success",
      mentorId: mentor._id,
      confirmedCount: confirmedMentees.length,
      mentees: confirmedMentees,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Helper function to create auto message
async function createAutoMessage(mentorId, studentId, mentorName) {
  try {
    const participants = [
      { user: mentorId, model: "Mentor" },
      { user: studentId, model: "Student" },
    ];
    
    const participantsHash = [mentorId.toString(), studentId.toString()]
      .sort()
      .join("_");
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({ participantsHash });
    
    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants,
        participantsHash,
      });
    }
    
    // Create welcome message
    const welcomeContent = `Hello, I'm ${mentorName}, your mentor. If you have any queries or need assistance, feel free to reach out anytime. Looking forward to working with you!`;
    
    const message = await Message.create({
      conversationId: conversation._id,
      sender: mentorId,
      senderModel: "Mentor",
      receiver: studentId,
      receiverModel: "Student",
      content: welcomeContent,
      status: "sent",
    });
    
    // Update conversation with last message
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();
    
    console.log(`Welcome message sent to student ${studentId} from agent ${mentorId}`);
  } catch (error) {
    console.error("Error creating welcome message:", error);
    // Don't throw - we don't want to break agent assignment if messaging fails
  }
}

// Confirming the status of the student that wants to connect to the mentor
export const confirmMenteeStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    // Confirming the mentee's status to confirmed
    const mentor = await Mentor.findOneAndUpdate(
      {
        _id: userId,
        "mentees.student": studentId,
        "mentees.status": "pending",
      },
      {
        $set: { "mentees.$.status": "confirmed" },
      },
      { new: true },
    )
      .select("_id name")
      .populate({
        path: "mentees.student",
        select: "name email phone profileUrl",
      });
    // if null
    if (!mentor) {
      return res.status(404).json({
        message: "Already confirmed or mentor not found",
      });
    }
    // Having to connect the student to the mentor
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "connectedMentor.mentor": userId,
          "connectedMentor.status": "confirmed",
        },
      },
      { new: true, runValidators: true },
    ).select("_id name email connectedMentor");

    // Find the confirmed mentee entry
    const confirmedMentee = mentor.mentees.find(
      (m) => m.student._id.toString() === studentId,
    );

    if (!confirmedMentee) {
      return res.status(404).json({ message: "Confirmed mentee not found" });
    }

    const studentEmail = confirmedMentee.student.email;
    const mentorName = mentor.name;
    const studentName = confirmedMentee.student.name;

    // if Success
    await sendMenteeEmail(studentEmail, mentorName, "Mentor connection");

    await createAutoMessage(userId, studentId, mentor.name)

    return res.status(200).json({
      message: "Mentee status confirmed successfully",
      mentee: mentor,
    });
  } catch (e) {
    // Find the confirmed mentee entry
    con;
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Rejecting the connection by the student
export const cancelMenteeStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    // Confirming the mentee's status to confirmed
    const mentor = await Mentor.findOneAndUpdate(
      {
        _id: userId,
        "mentees.student": studentId,
        "mentees.status": "pending",
      },
      {
        $set: { "mentees.$.status": "rejected" },
      },
      { new: true },
    );
    // if null
    if (!mentor) {
      return res.status(404).json({
        message: "Already confirmed or rejected",
      });
    }
    // Having to connect the student to the mentor
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "connectedMentor.mentor": userId,
          "connectedMentor.status": "rejected",
        },
      },
      { new: true, runValidators: true },
    ).select("_id name email connectedMentor");

    // sending the notification to the student
    await sendStudentPushNotification({
      studentId: updatedStudent._id,
      triggerId: userId,
      title: `Your connection with ${mentor.name} was rejected`,
      body: "Connect with different mentor",
    });
    return res
      .status(200)
      .json({ message: "Connection rejected", mentor: mentor });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Fetching the student from the mentor with course and university selected when he/she is confirmed in mentor connection
export const getStudentConfirmed = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    const mentor = await Mentor.findById(userId).populate({
      path: "mentees.student",
      select:
        "name email phone profileUrl nationality selectedUniversity selectedCourse",
      populate: [
        { path: "selectedUniversity", select: "name country profileUrl websiteURL" },
        { path: "selectedCourse", select: "title level duration intake fee" },
      ],
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    // Only the confirmed mentees are shown
    const confirmedMentees = mentor.mentees.filter(
      (m) => m.status === "confirmed" && m.student,
    );

    return res.status(200).json({
      message: "Success",
      mentorId: mentor._id,
      confirmedCount: confirmedMentees.length,
      mentees: confirmedMentees,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Creating a new appointment with sending the email
export const createAppointment = async (req, res) => {
  try {
    const { studentId, time, date, meeting, purpose } = req.body;
    const userId = req.user.id;
    // creating the new appointment
    const appointment = await Appointment.create({
      mentorId: userId,
      studentId,
      time,
      date,
      meeting,
      purpose,
    });
    // Fetching the student email
    const studentEmail = await Student.findById(studentId).select("email");
    // Fetching the mentor name
    const mentorName = await Mentor.findById(userId).select("name");
    //sending the email
    await sendAppointmentEmail(
      studentEmail,
      mentorName.name,
      appointment.time,
      appointment.date,
    );
    return res.status(201).json({
      message: "Appointment created successfully",
      appointment: appointment,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
// Getting all the appointments
export const getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    //getting all the appointment
    const appointment = await Appointment.find({
      mentorId: userId,
    }).populate({
      path: "studentId",
      select: "name",
    });
    return res.status(200).json({
      message: "Appointment fetched successfully",
      appointment: appointment,
    });
  } catch {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Updating the mentor
export const updateAppointments = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const update = req.body;
    //Updating the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      update,
      {
        new: true,
        runValidators: true,
      },
    );
    // Successful
    return res.status(200).json({
      message: "Updated Successfully",
      appointment: updatedAppointment,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Action to cancel the appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    // updating the appointment status
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        status: "Scheduled",
      },
      {
        $set: { status: "Cancelled" },
      },
      { new: true },
    );
    if (!appointment) {
      return res.status(404).json({
        message: "Appoinment not found or appoinment is completed or cancelled",
      });
    }
    return res
      .status(200)
      .json({ message: "Success", appointment: appointment });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Action to confirm the appointment
export const confirmedAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    // updating the appointment status
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        status: "Scheduled",
      },
      {
        $set: { status: "Completed" },
      },
      { new: true },
    );
    if (!appointment) {
      return res.status(404).json({
        message: "Appoinment not found or appoinment is completed or cancelled",
      });
    }
    return res
      .status(200)
      .json({ message: "Success", appointment: appointment });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
//Searching appointment by student name
export const searchAppointmentsByStudentName = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { name } = req.query; // student name to search

    if (!name) {
      return res.status(400).json({ message: "Student name is required" });
    }

    const appointments = await Appointment.find({ mentorId }).populate({
      path: "studentId",
      match: { name: { $regex: name, $options: "i" } }, // case-insensitive search
      select: "name email phone",
    });

    // populate with match returns null if no match, so filter them out
    const filteredAppointments = appointments.filter(
      (a) => a.studentId !== null,
    );

    return res.status(200).json({
      message: "Appointments fetched successfully",
      count: filteredAppointments.length,
      appointments: filteredAppointments,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Getting the student profile by their id
export const getStudentProfileById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .select("-password") // password is already select:false, but safe
      .populate({
        path: "selectedUniversity",
        select: "name profileUrl", // university name
      })
      .populate({
        path: "selectedCourse",
        select: "title ", // depending on your Course schema (use what exists)
      });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // return a clean response
    return res.status(200).json({
      message: "Student profile fetched successfully",
      student,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server Error" });
  }
};
