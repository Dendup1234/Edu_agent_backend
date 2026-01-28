import Application from "../../models/application.js"

export const getApplicationStatus = async(req, res) => {
    try {
        const { studentId } = req.params;
        const application = await Application.find({
            applicationFor: studentId
        }).select("stage status")
        return res.status(200).json(application)
    }
    catch(err){
        console.error(err)
        return res.status(500).json({ message: err.message });
    }
}

