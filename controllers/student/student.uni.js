import University from "../../models/university.js";
import Agency from "../../models/agency.js";
import mongoose from "mongoose";

export const searchUniByName = async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "Token not found" });
    }
    const { agencyId } = req.params;
    // search params
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "q (search term) is required" });
    }
    //finding uni in the agency schema
    const university = await Agency.findById(agencyId)
      .select("_id partnerUniversities")
      .populate({
        path: "partnerUniversities",
        select: "profileUrl name",
        match: {
          name: { $regex: q, $options: "i" }, // case-insensitive search
        },
      })
      .lean();
    // successful response
    return res.status(200).json({
      message: "Success",
      universities: university,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
