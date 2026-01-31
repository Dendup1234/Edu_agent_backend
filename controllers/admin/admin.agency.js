import Admin from "../../models/admin.js";
import Agency from "../../models/agency.js";

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
