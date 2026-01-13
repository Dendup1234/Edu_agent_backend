import { verifyToken } from "../utils/jwt.js";

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
