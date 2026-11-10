require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const readline = require("readline");
const Admin = require("../models/Admin");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

const createAdmin = async () => {
  try {
    const name = await ask("Enter admin name: ");
    const email = await ask("Enter admin email: ");
    const password = await ask("Enter admin password (minimum 8 characters): ");

    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error("Invalid details. Check name, email and password.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingAdmin) {
      console.log("An account with this email already exists.");
      return;
    }

    await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "admin",
    });

    console.log("Admin account created successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
};

createAdmin();
