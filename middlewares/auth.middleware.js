import { verifyToken } from "../utils/jwt.js";
import Agent from "../models/agent.js";

// Protect middleware
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    //Spliting the token
    const token = authHeader.split(" ")[1];

    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

//Only the verfied agent can access the page
export const requireVerifiedAgent = (req, res, next) => {
  if (!req.user?.sub) return res.status(401).json({ message: "Unauthorized" });

  // verifying the agent
  if (!req.user.isVerified) {
    return res.status(403).json({
      message:
        "Account not verified. Please change password / verify your account first.",
    });
  }
  next();
};

//Role based middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Unauthorized access" });
    }
    next();
  };
};

//Require permissions middleware
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // for the agency without any restriction
      if (req.user.actor === "Agency") {
        return next();
      }
      // for the student without any restriction
      if (req.user.actor === "Student") {
        return next();
      }
      if (req.user.actor === "Admin") {
        return next();
      }
      //console.log(req.user.id);
      const agent = await Agent.findById(req.user.id)
        .select("status isVerified agency systemRole roleId")
        .populate({ path: "roleId", select: "permissions isActive agencyId" })
        .lean();
      // printing the agent
      //console.log(agent);
      if (!agent) return res.status(401).json({ message: "Unauthorized" });
      if (agent.isActive == false)
        return res.status(403).json({ message: "Inactive account" });
      if (!agent.isVerified)
        return res.status(403).json({ message: "Account not verified" });

      // tenant safety
      if (
        agent.roleId &&
        String(agent.roleId.agencyId) !== String(agent.agency)
      ) {
        return res
          .status(403)
          .json({ message: "Invalid role for this agency" });
      }

      if (agent.roleId && agent.roleId.isActive === false) {
        return res.status(403).json({ message: "Role disabled" });
      }

      const perms = agent.roleId?.permissions || [];

      if (!perms.includes(permission)) {
        return res
          .status(403)
          .json({ message: "Forbidden: missing permission" });
      }

      next();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Server error" });
    }
  };
};
