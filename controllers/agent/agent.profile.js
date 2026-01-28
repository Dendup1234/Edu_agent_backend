import Agent from "../../models/agent.js";
import Student from "../../models/student.js";
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
    // returing a status
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
