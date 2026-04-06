import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({
    id: user._id,
    name: user.name,
    email: user.email
  }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all required fields" });
    }

    // Enhanced validation
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user),
      },
      message: "User registered successfully"
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Registration failed" 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginId = String(email || '').trim();

    const isEmail = loginId.includes('@');
    const query = isEmail
      ? { email: loginId.toLowerCase() }
      : { name: loginId };

    const user = await User.findOne(query);

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user),
        },
        message: "Login successful"
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email/username or password" });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};