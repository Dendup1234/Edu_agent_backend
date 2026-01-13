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

// Sending account email
export const sendAccountEmail = async (email, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { subject, title, body, password } = message;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2>${title}</h2>
      <p>${body}</p>
      ${
        password
          ? `<p><strong>Temporary Password:</strong> ${password}</p>`
          : ""
      }
      <p style="color:gray;font-size:12px;">
        Please change your password after first login.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject || "Account Information",
    text: `
${title}
${body}
${password ? `Temporary Password: ${password}` : ""}
`,
    html: htmlTemplate,
  });
};
