import Admin from "../../models/admin.js";
import Agency from "../../models/agency.js";

// getting all the agency with the total agency count
export const getAllAgency = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ message: "Token not found" });
    }
    //finding all the agency with student,mentor,employee,uni,lead and then status
    const agency = await Agency.aggregate([
      { $sort: { createdAt: -1 } },
      { $match: { isVerified: true } },

      // outer left join from other collections

      //student count
      {
        $lookup: {
          from: "students",
          let: { agencyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$registeredAgency", "$$agencyId"] } } },
            { $count: "count" },
          ],
          as: "studentCountAgg",
        },
      },
      //  eventCount
      {
        $lookup: {
          from: "events",
          let: { agencyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$organizerId", "$$agencyId"] } } },
            { $count: "count" },
          ],
          as: "eventCountAgg",
        },
      },

      // agentCount
      {
        $lookup: {
          from: "agents",
          let: { agencyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$agency", "$$agencyId"] } } },
            { $count: "count" },
          ],
          as: "agentCountAgg",
        },
      },
      // shaping the response
      {
        $project: {
          organizationName: 1,
          name: 1,
          email: 1,
          phone: 1,
          isVerified: 1,
          logo: 1,

          joinDate: "$createdAt",

          // uniCount from the array length
          uniCount: { $size: { $ifNull: ["$partnerUniversities", []] } },

          // counts from lookups
          studentCount: {
            $ifNull: [{ $arrayElemAt: ["$studentCountAgg.count", 0] }, 0],
          },
          eventCount: {
            $ifNull: [{ $arrayElemAt: ["$eventCountAgg.count", 0] }, 0],
          },
          agentCount: {
            $ifNull: [{ $arrayElemAt: ["$agentCountAgg.count", 0] }, 0],
          },
        },
      },
    ]);
    return res.status(200).json({
      total: agency.length,
      agency,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// getting the inactive and the active count of the agency
export const getAgencyStatusCount = async (req, res) => {
  try {
    const active = await Agency.countDocuments({ isVerified: true });
    const inactive = await Agency.countDocuments({ isVerified: false });

    res.status(200).json({
      active,
      inactive,
      total: active + inactive,
    });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

//deactivating the agency
export const deactivateAgency = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { agencyId } = req.params;

    if (!agencyId) {
      return res.status(400).json({ message: "Agency ID is required" });
    }

    const agency = await Agency.findByIdAndUpdate(
      agencyId,
      { isVerified: false },
      { new: true },
    ).select("organizationName isVerified");

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    return res.status(200).json({
      message: "Agency deactivated successfully",
      agency,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// searching agency by organization name
export const searchAgencyByOrganizationName = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token not found" });

    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    const agencies = await Agency.aggregate([
      { $match: { isVerified: true } },

      // filter by organizationName
      { $match: { organizationName: { $regex: q, $options: "i" } } },

      { $sort: { createdAt: -1 } },

      // student count
      {
        $lookup: {
          from: "students",
          let: { agencyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$registeredAgency", "$$agencyId"] } } },
            { $count: "count" },
          ],
          as: "studentCountAgg",
        },
      },

      // event count
      {
        $lookup: {
          from: "events",
          let: { agencyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$organizerId", "$$agencyId"] } } },
            { $count: "count" },
          ],
          as: "eventCountAgg",
        },
      },

      // agent count
      {
        $lookup: {
          from: "agents",
          let: { agencyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$agency", "$$agencyId"] } } },
            { $count: "count" },
          ],
          as: "agentCountAgg",
        },
      },

      // shape response
      {
        $project: {
          organizationName: 1,
          name: 1,
          email: 1,
          phone: 1,
          isVerified: 1,
          logo: 1,
          joinDate: "$createdAt",

          uniCount: { $size: { $ifNull: ["$partnerUniversities", []] } },

          studentCount: {
            $ifNull: [{ $arrayElemAt: ["$studentCountAgg.count", 0] }, 0],
          },
          eventCount: {
            $ifNull: [{ $arrayElemAt: ["$eventCountAgg.count", 0] }, 0],
          },
          agentCount: {
            $ifNull: [{ $arrayElemAt: ["$agentCountAgg.count", 0] }, 0],
          },
        },
      },
    ]);

    return res.status(200).json({
      total: agencies.length,
      agencies,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
