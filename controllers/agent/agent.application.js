import Application from "../../models/application.js";
import Student from "../../models/student.js"

// Get all applications for a student
export const getStudentApplication = async (req, res) => {
  try {
    const { studentId } = req.params;
    const application = await Application.find({ applicationFor: studentId });
    return res.status(200).json(application);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// Update status of a specific stage in an application
export const updateStageStatus = async (req, res) => {
  try {
    const { studentId } = req.params; 
    const { stageName, status } = req.body; 

    if (!stageName || !status) {
      return res.status(400).json({ message: "stageName and status are required" });
    }

    const application = await Application.findById(studentId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Find the stage
    const stage = application.stages.find(s => s.name === stageName);
    if (!stage) {
      return res.status(400).json({ message: "Stage not found in application" });
    }

    // Update status
    stage.status = status;

    await application.save();
    return res.status(200).json(application);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// update student eligibility
export const updateStudentEligibility = async (req, res) => {
  try {
    const { studentId } = req.params; 
    const { isEligible } = req.body; 

    if(!isEligible){
      return res.status(400).json({ message: "student eligibility required"})
    }

    const student = await Student.findByIdAndUpdate(
      studentId, isEligible, {
      new: true,
      runValidators: true
    })
    if(!student){
       return res.status(404).json({ message: "Student not found" });
    }
    return res.status(200).json({ message: "udpate successful" })
  }
  catch (err){
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
}