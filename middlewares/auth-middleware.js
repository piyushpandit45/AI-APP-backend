import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

// Middleware to protect routes
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    if (!token.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, invalid token format" });
    }

    token = token.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: "Not authorized, invalid token payload" });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Not authorized, token expired" });
    }
    res.status(500).json({ success: false, message: "Server error in authentication" });
  }
};

