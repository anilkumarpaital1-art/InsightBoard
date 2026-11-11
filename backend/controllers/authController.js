
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const Admin = require("../models/Admin");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// Generate JWT token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Format user response
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// Login (Admin + Viewer)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await Admin.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
};

// Public User Registration
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const newUser = await Admin.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "viewer",
      isActive: true,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: formatUser(newUser),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
};

// Google Login / Registration
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        message: "Google authentication is not configured.",
      });
    }

    // Verify Google's ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        message: "Google account verification failed.",
      });
    }

    const email = payload.email.trim().toLowerCase();

    // Find existing account
    let user = await Admin.findOne({ email });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          message: "Your account is inactive. Contact the administrator.",
        });
      }
    } else {
      // New Google users are always Viewers
      user = await Admin.create({
        name: payload.name || email.split("@")[0],
        email,
        password: crypto.randomBytes(32).toString("hex"),
        role: "viewer",
        isActive: true,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Google login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error.message);

    return res.status(401).json({
      message: "Google authentication failed. Please try again.",
    });
  }
};

module.exports = {
  login,
  register,
  googleLogin,
};
