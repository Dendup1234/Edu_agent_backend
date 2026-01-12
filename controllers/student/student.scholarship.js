import Scholarship from "../../models/scholarship.js";

//Searching scholarship by their name
export const searchScholarshipByName = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "token not found" });
    }
    const { agencyId } = req.params;
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    // searching scholarship by their name
    const scholarship = await Scholarship.find({
      createdBy: agencyId,
      title: { $regex: q, $options: "i" },
    }).select("_id title");

    // response
    return res
      .status(200)
      .json({ message: "Successful", scholarship: scholarship });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
