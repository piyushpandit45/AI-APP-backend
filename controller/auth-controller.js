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
    console.log('🔍 Signup request received:', req.body.email);
    console.log('📍 Request headers:', {
      'content-type': req.headers['content-type'],
      'origin': req.headers['origin'],
    });
    
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.warn('⚠️ Missing fields in signup:', { name: !!name, email: !!email, password: !!password });
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
      console.warn('⚠️ User already exists:', email);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword
    });

    console.log('✅ User created successfully:', user.email);

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
    console.error("❌ Registration error:", error.message);
    console.error("📍 Error details:", error);
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
    console.log('🔍 Login request received:', req.body.email);
    console.log('📍 Request headers:', {
      'content-type': req.headers['content-type'],
      'origin': req.headers['origin'],
    });
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.warn('⚠️ Missing email or password');
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    
    const loginId = String(email || '').trim();

    const isEmail = loginId.includes('@');
    const query = isEmail
      ? { email: loginId.toLowerCase() }
      : { name: loginId };

    console.log(`🔍 Searching for user with query:`, query);
    
    const user = await User.findOne(query);

    if (!user) {
      console.log('⚠️ User not found:', loginId);
      return res.status(401).json({ success: false, message: "Invalid email/username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (passwordMatch) {
      console.log('✅ Login successful for:', user.email);
      res.status(200).json({
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
      console.log('⚠️ Password mismatch for user:', loginId);
      res.status(401).json({ success: false, message: "Invalid email/username or password" });
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('📍 Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
  }
};