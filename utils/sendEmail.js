import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	await transporter.sendMail({
		from: `"OTP Service" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Your OTP Code",
		text: `Your OTP is ${otp}. It expires in 5 minutes.`,
	});
};
