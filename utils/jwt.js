import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

//Signing the token
export const signToken = async (payload) => {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.sign(secret);
};

// Verifying the token
export const verifyToken = async (token) => {
	const { payload } = await jwtVerify(token, secret);
	return payload;
};

