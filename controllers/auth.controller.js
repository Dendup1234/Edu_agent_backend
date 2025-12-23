import { signToken } from '../utils/jwt.js';

// login controller
export const login = async (req, res) => {
	//fake user for testing
	const user = {
		id: "1",
		email: "dendup091@gmail.com"
	};
	//Signing the token
	const token = await signToken({
		sub: user.id,
		email: user.email,
	});

	res.json({
		accessToken: token,
	});
};

