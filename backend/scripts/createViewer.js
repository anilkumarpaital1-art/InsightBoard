
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

const createViewer = async () => {
  try {
    const name = await ask("Enter viewer name: ");
    const email = await ask("Enter viewer email: ");
    const password = await ask("Enter viewer password (minimum 8 characters): ");

    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error("Invalid details. Check name, email and password.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existingUser = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "viewer",
    });

    console.log("Viewer account created successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    rl.close();
  }
};

createViewer();
