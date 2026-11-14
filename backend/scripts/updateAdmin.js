
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const readline = require("readline");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

const updateAdmin = async () => {
  try {
    const currentEmail = await ask("Enter current admin email: ");
    const newName = await ask("Enter new admin name: ");
    const newEmail = await ask("Enter new admin email: ");
    const newPassword = await ask("Enter new admin password: ");

    if (
      !currentEmail.trim() ||
      !newEmail.trim() ||
      !newName.trim() ||
      newPassword.length < 8
    ) {
      throw new Error("Invalid details. Password must be at least 8 characters.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const admin = await Admin.findOne({
      email: currentEmail.trim().toLowerCase(),
    });

    if (!admin) {
      throw new Error("Existing admin account not found.");
    }

    const emailExists = await Admin.findOne({
      email: newEmail.trim().toLowerCase(),
      _id: { $ne: admin._id },
    });

    if (emailExists) {
      throw new Error("New email is already being used.");
    }

    admin.name = newName.trim();
    admin.email = newEmail.trim().toLowerCase();
    admin.password = newPassword;

    await admin.save();

    console.log("Admin credentials updated successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    rl.close();
  }
};

updateAdmin();
