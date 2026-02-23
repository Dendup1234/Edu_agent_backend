import Admin from "../../models/admin.js";
import { generatePassword } from "../../utils/password.js";
import bcrypt from "bcryptjs";
import { sendAccountEmail } from "../../utils/sendEmail.js";
//Creating an account of the mentor under the agency
export const createAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }

    const { name, email, phone } = req.body;

    //check if agent already exists
    const existingMentor = await Admin.findOne({ email });
    if (existingMentor) {
      return res
        .status(409)
        .json({ message: "Admin with this email already exists" });
    }
    // Getting the day that the mentor is created for join date
    const joinDate = new Date();
    //Trim ing the email
    const normalizedEmail = email.toLowerCase().trim();
    // Generating a new password
    const plainPassword = generatePassword(10);
    //encrypting the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    // Creating a new agent
    const mentor = await Admin.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
    });
    //Sending the email to the particular mentors
    await sendAccountEmail(normalizedEmail, {
      subject: "Your Admin Account is Ready",
      title: "Welcome to EduAgent",
      body: "Your admin account has been created by your superadmin.",
      password: plainPassword,
    });

    //Success
    return res.status(201).json({
      message: "Admin created successfully",
      mentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// getting all the admin with total count
export const getAllAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Token invalid " });
    }
    //getting all the admin
    const admin = await Admin.find({
      role: "admin",
    });
    const adminCount = admin.length;

    //Success
    return res.status(200).json({
      message: "success",
      admin: admin,
      adminCount: adminCount,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Server error" });
  }
};
