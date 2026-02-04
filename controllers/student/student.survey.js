import Student from "../../models/student.js";

export const updateVisaProfile = async (req, res) => {
  try {
    const studentId = req.user.sub; 

    const { hasSpouse, hasChildren } = req.body;

    if (typeof hasSpouse !== "boolean" || typeof hasChildren !== "boolean") {
      return res.status(400).json({
        message: "hasSpouse and hasChildren must be boolean values",
      });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "visaProfile.hasSpouse": hasSpouse,
          "visaProfile.hasChildren": hasChildren,
        },
      },
      { new: true, runValidators: true }
    ).select("visaProfile");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      message: "Visa profile updated successfully",
      data: student.visaProfile,
    });
  } catch (err) {
    console.error("updateVisaProfile:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
