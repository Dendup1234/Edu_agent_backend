import Agent from "../../models/agent.js";
import Student from "../../models/student.js";
import Appointment from "../../models/appointment.js";
import { sendAppointmentEmail } from "../../utils/sendEmail.js";
// Custom role apis
export const getAgentinformation = async (req, res) => {
  try {
    const userId = req.user.id;
    //fetching the information about the agent with its role and permission
    const agent = await Agent.findById(userId)
      .select("_id name roleId systemRole")
      .populate({
        path: "roleId",
        select: "name permissions",
      })
      .lean();
    // returing a statuses 
    return res.status(200).json({ message: "Success", agent: agent });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Getting the student list if they have a selected course and uni
export const getStudentList = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "token not found" });
    }
    const studentList = await Student.find({
      assignedAgent: userId,
      isValid: true,
      selectedCourse: { $ne: null },
      selectedUniversity: { $ne: null },
    })
      .select(
        "name statusHistory selectedCourse selectedUniversity assignedAgent",
      )
      .populate({
        path: "selectedCourse",
        select: "title",
      })
      .populate({
        path: "selectedUniversity",
        select: "name country",
      })
      .lean();

    console.log(studentList);
    // Finding the count of student
    const studentCount = studentList.length;

    // Creating the custom map of object
    const student = studentList.map((s) => ({
      student: {
        id: s._id,
        name: s.name,
      },
      course: {
        id: s.selectedCourse?._id,
        title: s.selectedCourse?.title,
      },
      university: {
        id: s.selectedUniversity?._id,
        name: s.selectedUniversity?.name,
        country: s.selectedUniversity?.country,
      },
      statusHistory: s.statusHistory,
    }));

    return res.status(200).json({
      message: "Success",
      students: student,
      studentCount: studentCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Creating a new appointment with sending the email
export const createAppointment = async (req, res) => {
  try {
    const { studentId, time, date, meeting, purpose } = req.body;
    const userId = req.user.id;
    // creating the new appointment
    const appointment = await Appointment.create({
      agentId: userId,
      studentId,
      time,
      date,
      meeting,
      purpose,
    });
    // Fetching the student email
    const studentEmail = await Student.findById(studentId).select("email");
    // Fetching the mentor name
    const agentName = await Agent.findById(userId).select("name");
    //sending the email
    await sendAppointmentEmail(
      studentEmail,
      agentName.name,
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
      agentId: userId,
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
    const agentId = req.user.id;
    const { name } = req.query; // student name to search

    if (!name) {
      return res.status(400).json({ message: "Student name is required" });
    }

    const appointments = await Appointment.find({ agentId }).populate({
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
        select: "name logo", // university name
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
