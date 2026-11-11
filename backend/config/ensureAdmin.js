
const Admin = require("../models/Admin");

const ensureAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin environment variables are missing.");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must contain at least 8 characters.");
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();

    // Find the predefined Admin account
    let admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      // Create the Admin account
      admin = await Admin.create({
        name: ADMIN_NAME.trim(),
        email,
        password: ADMIN_PASSWORD,
        role: "admin",
        isActive: true,
      });

      console.log("Predefined Admin account created successfully.");
    } else {
      // Ensure the configured account remains an active Admin
      admin.name = ADMIN_NAME.trim();
      admin.role = "admin";
      admin.isActive = true;
      await admin.save();

      console.log("Predefined Admin account verified.");
    }
  } catch (error) {
    console.error("Admin initialization failed:", error.message);
    throw error;
  }
};

module.exports = ensureAdmin;
