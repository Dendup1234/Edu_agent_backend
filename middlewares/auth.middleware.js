import { verifyToken } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({ message: "No token provided" });
		}

		const token = authHeader.split(" ")[1];

		const payload = await verifyToken(token);

		req.user = payload;
		next();
	} catch (err) {
		res.status(401).json({ message: "Invalid or expired token" });
	}
};
