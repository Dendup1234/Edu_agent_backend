import Application from "../../models/application.js";

export const getStudentApplication = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId){
      return res.status(400).json({message: "student ID required"})
    }
    const application = await Application.find({ applicationFor: studentId });
    return res.status(200).json(application);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
