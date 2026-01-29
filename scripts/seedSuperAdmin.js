import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";

// Script to generate the admin
export async function seedSuperAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.log("Bootstrap admin env vars not set. Skipping seed.");
    return;
  }

  const existing = await Admin.findOne({ email }).lean();
  if (existing) {
    console.log("Super Admin already exists. Skipping seed.");
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  await Admin.create({
    name,
    email,
    password: hashed,
    isActive: true,
    isVerified: true,
    role: "super-admin",
  });

  console.log("Super Admin created:", email);
}
