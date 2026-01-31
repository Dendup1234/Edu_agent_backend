import University from "../../models/university.js";
import Agency from "../../models/agency.js";

export const getAllUniversitiesAdmin = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token not found" });

    const universities = await University.aggregate([
      { $sort: { createdAt: -1 } },

      // agencies that have this university as partner
      {
        $lookup: {
          from: "agencies",
          let: { uniId: "$_id" },
          pipeline: [
            { $match: { $expr: { $in: ["$$uniId", "$partnerUniversities"] } } },
            { $project: { organizationName: 1 } },
          ],
          as: "agencies",
        },
      },

      // students who selected this university
      {
        $lookup: {
          from: "students",
          let: { uniId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$selectedUniversity", "$$uniId"] } } },
            { $count: "count" },
          ],
          as: "studentCountAgg",
        },
      },

      // shape output
      {
        $project: {
          name: 1,
          country: 1,
          status: 1,

          // show first agency name (like your table)
          agencyName: {
            $ifNull: [
              { $arrayElemAt: ["$agencies.organizationName", 0] },
              null,
            ],
          },

          // number of agencies (optional)
          agencyCount: { $size: { $ifNull: ["$agencies", []] } },

          // students count
          students: {
            $ifNull: [{ $arrayElemAt: ["$studentCountAgg.count", 0] }, 0],
          },

          // programs count (courses array)
          programs: { $size: { $ifNull: ["$courses", []] } },

          createdAt: 1,
        },
      },
    ]);

    // add serial id like 01, 02...
    const rows = universities.map((u, index) => ({
      id: String(index + 1).padStart(2, "0"),
      universityId: u._id,
      university: u.name,
      agency: u.agencyName,
      country: u.country,
      status: u.status,
      students: u.students,
      programs: u.programs,
      agencyCount: u.agencyCount,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      message: "Success",
      total: rows.length,
      rows,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// get uni dashboard
export const getUniDashboard = async (req, res) => {
  try {
    const agencies = await Agency.find()
      .select("partnerUniversities")
      .populate({
        path: "partnerUniversities",
        select: "status courses",
        populate: {
          path: "courses",
          select: "status", // assumes Course has status: open/closed
        },
      })
      .lean();

    let activeUni = 0;
    let inactiveUni = 0;
    let activeCourse = 0; // open
    let inactiveCourse = 0; // closed

    for (const agency of agencies) {
      for (const uni of agency.partnerUniversities || []) {
        if (uni.status === "Active") activeUni++;
        if (uni.status === "Inactive") inactiveUni++;

        // count courses by status
        for (const c of uni.courses || []) {
          if (c.status === "open") activeCourse++;
          if (c.status === "closed") inactiveCourse++;
        }
      }
    }

    return res.status(200).json({
      message: "Success",
      activeUni,
      inactiveUni,
      activeCourse,
      inactiveCourse,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "server error" });
  }
};

export const searchUniversitiesAdmin = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token not found" });

    const q = (req.query.q || "").trim();
    if (!q)
      return res.status(400).json({ message: "Query param 'q' is required" });

    const universities = await University.aggregate([
      {
        $match: {
          name: { $regex: q, $options: "i" },
        },
      },

      { $sort: { createdAt: -1 } },

      // agencies that have this university as partner
      {
        $lookup: {
          from: "agencies",
          let: { uniId: "$_id" },
          pipeline: [
            { $match: { $expr: { $in: ["$$uniId", "$partnerUniversities"] } } },
            { $project: { organizationName: 1 } },
          ],
          as: "agencies",
        },
      },

      // students who selected this university
      {
        $lookup: {
          from: "students",
          let: { uniId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$selectedUniversity", "$$uniId"] } } },
            { $count: "count" },
          ],
          as: "studentCountAgg",
        },
      },

      // shape output
      {
        $project: {
          name: 1,
          country: 1,
          status: 1,

          agencyName: {
            $ifNull: [
              { $arrayElemAt: ["$agencies.organizationName", 0] },
              null,
            ],
          },
          agencyCount: { $size: { $ifNull: ["$agencies", []] } },

          students: {
            $ifNull: [{ $arrayElemAt: ["$studentCountAgg.count", 0] }, 0],
          },

          programs: { $size: { $ifNull: ["$courses", []] } },
          createdAt: 1,
        },
      },
    ]);

    const rows = universities.map((u, index) => ({
      id: String(index + 1).padStart(2, "0"),
      universityId: u._id,
      university: u.name,
      agency: u.agencyName,
      country: u.country,
      status: u.status,
      students: u.students,
      programs: u.programs,
      agencyCount: u.agencyCount,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      message: "Success",
      total: rows.length,
      query: q,
      rows,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
