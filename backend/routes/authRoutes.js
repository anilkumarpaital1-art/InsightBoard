
const express = require("express");
const router = express.Router();

const {
  login,
  register,
  googleLogin,
} = require("../controllers/authController");

// Admin and Viewer login
router.post("/login", login);

// Public Viewer registration
router.post("/register", register);

// Google login and registration
router.post("/google", googleLogin);

module.exports = router;
