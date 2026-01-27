import nodemailer from "nodemailer"; // Optional: for better logging

// Create a single reusable transporter instance
let transporter = null;

/**
 * Initialize or get the transporter instance
 * Uses connection pooling for better performance
 */
const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true, // Use connection pooling
  });

  // Verify connection configuration
  transporter.verify((error) => {
    if (error) {
      console.error("Transporter verification failed:", error);
    } else {
      console.log("Email transporter is ready to send messages");
    }
  });

  return transporter;
};

/**
 * Generic email sending function with retry logic
 */
const sendEmail = async (mailOptions, retries = 3) => {
  const transporter = getTransporter();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        throw new Error(
          `Failed to send email after ${retries} attempts: ${error.message}`,
        );
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }
};

/**
 * HTML template builder for consistent styling
 */
const buildHtmlTemplate = (content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.subject || "EduAgent Notification"}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e0e0e0;
        }
        .info-box {
          background: #e8f4fd;
          border-left: 4px solid #2196f3;
          padding: 12px;
          margin: 16px 0;
          border-radius: 4px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${content.title || "EduAgent"}</h1>
      </div>
      <div class="content">
        ${content.body || ""}
        ${content.info ? `<div class="info-box">${content.info}</div>` : ""}
        ${
          content.buttonText && content.buttonUrl
            ? `<a href="${content.buttonUrl}" class="btn">${content.buttonText}</a>`
            : ""
        }
      </div>
      <div class="footer">
        <p>This is an automated message from EduAgent Support.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </body>
  </html>
`;

// Send OTP Email
export const sendOtpEmail = async (email, otp) => {
  const htmlContent = buildHtmlTemplate({
    title: "Your OTP Code",
    body: `<p>Your One-Time Password (OTP) is:</p>
           <h2 style="text-align: center; color: #2196f3; font-size: 32px;">${otp}</h2>
           <p>This code will expire in <strong>5 minutes</strong>.</p>
           <p>If you didn't request this code, please ignore this email.</p>`,
  });

  await sendEmail({
    from: `"OTP Service" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: htmlContent,
    priority: "high", // Mark OTP emails as high priority
  });
};

// Send Mentor Connection Email
export const sendMenteeEmail = async (email, mentor) => {
  const htmlContent = buildHtmlTemplate({
    title: "Connection Accepted",
    body: `<p>Congratulations! Your connection request with mentor <strong>${mentor}</strong> has been accepted.</p>
           <p>You can now schedule appointments and communicate with your mentor through the EduAgent platform.</p>`,
    buttonText: "View Mentor Profile",
    buttonUrl: `${process.env.APP_URL}/mentor/${mentor}`,
  });

  await sendEmail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Connection with ${mentor} Accepted`,
    text: `Your connection request with mentor ${mentor} has been accepted.`,
    html: htmlContent,
  });
};

// Send Appointment Email
export const sendAppointmentEmail = async (email, mentorName, time, date) => {
  const htmlContent = buildHtmlTemplate({
    title: "Appointment Confirmed",
    body: `<p>Your appointment has been scheduled successfully.</p>
           <div class="info-box">
             <p><strong>Mentor:</strong> ${mentorName}</p>
             <p><strong>Date:</strong> ${date}</p>
             <p><strong>Time:</strong> ${time}</p>
           </div>
           <p>Please join the meeting 5 minutes before the scheduled time.</p>`,
    buttonText: "View Calendar",
    buttonUrl: `${process.env.APP_URL}/calendar`,
  });

  await sendEmail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Appointment with ${mentorName}`,
    text: `You have an appointment with ${mentorName} at ${time} on ${date}`,
    html: htmlContent,
  });
};

// Send Account Email
export const sendAccountEmail = async (email, message) => {
  const { subject, title, body, password } = message;

  const htmlContent = buildHtmlTemplate({
    title: title || "Account Information",
    body: `<p>${body || "Your account has been created successfully."}</p>
           ${
             password
               ? `<div class="info-box">
                <p><strong>Temporary Password:</strong> ${password}</p>
                <p><em>Please change your password after first login.</em></p>
              </div>`
               : ""
           }`,
    buttonText: "Login to Account",
    buttonUrl: `${process.env.APP_URL}/login`,
  });

  await sendEmail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject || "Account Information",
    text: `${title || "Account Information"}\n\n${body || ""}${
      password ? `\n\nTemporary Password: ${password}` : ""
    }`,
    html: htmlContent,
  });
};

// Send Event Success Email
export const sendEventSuccessEmail = async (email, message) => {
  const { subject, title, startTime, timeZone, body, link, password } = message;

  const htmlContent = buildHtmlTemplate({
    title: title || "Event Registration Confirmed",
    body: `<p>${body || "Your event registration was successful."}</p>
           <div class="info-box">
             <p><strong>Start Time:</strong> ${startTime}</p>
             <p><strong>Time Zone:</strong> ${timeZone}</p>
             ${link ? `<p><strong>Meeting Link:</strong> <a href="${link}">Join Event</a></p>` : ""}
             ${password ? `<p><strong>Meeting Password:</strong> ${password}</p>` : ""}
           </div>
           <p>We recommend joining the meeting 10 minutes before the scheduled start time.</p>`,
    buttonText: link ? "Join Event" : "View Event Details",
    buttonUrl: link || `${process.env.APP_URL}/events`,
  });

  await sendEmail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject || "Event Registration Confirmed",
    text: `${title || "Event Registration Confirmed"}\n\n${body || ""}\n\nStart Time: ${startTime}\nTime Zone: ${timeZone}${
      link ? `\nMeeting Link: ${link}` : ""
    }${password ? `\nPassword: ${password}` : ""}`,
    html: htmlContent,
  });
};

//Send seated success email
// Send Seated Event Success Email (Bulk Seats)
export const sendSeatedEventSuccessEmail = async (email, message) => {
  const {
    subject,
    title,
    startTime,
    timeZone,
    body,
    seats, // "A1, A2, B3"
    seatIds, // ["65ff..1", "65ff..2"]
    ticketType, // optional or "Multiple"
    totalPrice, // 4500
  } = message;

  const htmlContent = buildHtmlTemplate({
    title: title || "Event Registration Confirmed",
    body: `
      <p>${body || "Your event registration was successful."}</p>

      <div class="info-box">
        <p><strong>Start Time:</strong> ${startTime}</p>
        <p><strong>Time Zone:</strong> ${timeZone}</p>

        ${seats ? `<p><strong>Seats:</strong> ${seats}</p>` : ""}

        ${
          Array.isArray(seatIds) && seatIds.length > 0
            ? `<p><strong>Seat IDs:</strong></p>
               <ul>
                 ${seatIds.map((id) => `<li>${id}</li>`).join("")}
               </ul>`
            : ""
        }

        ${
          ticketType ? `<p><strong>Ticket Type:</strong> ${ticketType}</p>` : ""
        }

        ${
          totalPrice !== undefined
            ? `<p><strong>Total Price:</strong> ${totalPrice} BTN</p>`
            : ""
        }
      </div>

      <p>Please arrive at the venue 15 minutes before the event starts.</p>
    `,
    buttonText: "View Event Details",
    buttonUrl: `${process.env.APP_URL}/events`,
  });

  await sendEmail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject || "Event Registration Confirmed",
    text: `
${title || "Event Registration Confirmed"}

${body || ""}

Start Time: ${startTime}
Time Zone: ${timeZone}
${seats ? `Seats: ${seats}\n` : ""}
${
  Array.isArray(seatIds) && seatIds.length > 0
    ? `Seat IDs:\n${seatIds.join("\n")}\n`
    : ""
}
${ticketType ? `Ticket Type: ${ticketType}\n` : ""}
${totalPrice !== undefined ? `Total Price: ${totalPrice} BTN\n` : ""}
    `,
    html: htmlContent,
  });
};

// Assign student with agent email
// Send email to both Student and Agent email
export const sendAgentAssignmentEmail = async ({
  studentEmail,
  agentEmail,
  agentName,
  studentName,
}) => {
  const htmlContent = buildHtmlTemplate({
    title: "Agent Assigned Successfully",
    body: `
      <p>The agent <strong>${agentName}</strong> has been successfully assigned.</p>
      <p>
        <strong>Student:</strong> ${studentName}<br/>
        <strong>Agent:</strong> ${agentName}
      </p>
      <p>You can now begin communication and schedule sessions through the EduAgent platform.</p>
    `,
  });

  const subject = `Agent ${agentName} Assigned Successfully`;

  const textContent = `
Agent Assigned Successfully

Student: ${studentName}
Agent: ${agentName}

`;

  const recipients = [studentEmail, agentEmail].filter(Boolean);

  await sendEmail({
    from: `"EduAgent Support" <${process.env.EMAIL_USER}>`,
    to: recipients, // Send to both student and agency
    subject,
    text: textContent,
    html: htmlContent,
  });
};

// Optional: Clean up transporter on app shutdown
export const closeTransporter = async () => {
  if (transporter) {
    await transporter.close();
    transporter = null;
    console.log("Email transporter closed");
  }
};
