import Document from "../../models/document.js"

export const getDocument = async(req, res) => {
    try {
        const studentId = req.body
        const document = Document.findById(studentId)
        return res.status(200).json(document)
    }
    catch(err){
        console.log(err)
        return res.status(500).json({ message: err.message })
    }
}