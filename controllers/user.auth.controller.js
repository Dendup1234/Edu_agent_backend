import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

//Register controller
export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ message: "name, email, password are required" });
		}

		const existing = await User.findOne({ email });
		if (existing) {
			return res.status(409).json({ message: "Email already registered" });
		}

		const hashed = await bcrypt.hash(password, 12);

		const user = await User.create({
			name,
			email,
			password: hashed,
		});

		const token = await signToken({ email: user.email });

		return res.status(201).json({
			message: "Registered successfully",
			user: { id: user._id, name: user.name, email: user.email },
			accessToken: token,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: "Internal server error" })

	}
};

// Login controller

export const login = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: "email and password are required" });
	}

	// password is select:false so we must explicitly select it
	const user = await User.findOne({ email }).select("+password");
	if (!user) {
		return res.status(401).json({ message: "Invalid email or password" });
	}

	const ok = await bcrypt.compare(password, user.password);
	if (!ok) {
		return res.status(401).json({ message: "Invalid password" });
	}

	const token = await signToken({ sub: user._id.toString(), email: user.email });

	return res.json({
		message: "Logged in successfully",
		user: { id: user._id, name: user.name, email: user.email },
		accessToken: token,
	});
};



