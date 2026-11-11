
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");

const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const ensureAdmin = require("./config/ensureAdmin");

require("dotenv").config();

// Fix Node.js DNS resolution for MongoDB Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);


// Test API
app.get("/", (req, res) => {
  res.send("InsightBoard Backend is Running!");
});

// MongoDB Connection

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Atlas Connected Successfully!");

    // Initialize predefined Admin account
    await ensureAdmin();

    console.log("Admin initialization completed.");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on port ${process.env.PORT || 5000}`
      );
    });
  })
  .catch((error) => {
    console.error("Backend Startup Failed:", error.message);
    process.exit(1);
  });
