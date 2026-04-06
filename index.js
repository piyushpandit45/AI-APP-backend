//! Main Express Server with MongoDB Atlas Connection

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/database-config.js";
import userRoutes from "./routes/auth-route.js";
import aiRoutes from "./routes/ai-route.js";
import sessionRoutes from "./routes/session-route.js";
import questionRoutes from "./routes/question-route.js";
import contactRoutes from "./routes/contact-route.js";

// 🔐 Load env variables
dotenv.config();

// 1) create app
const app = express();

// 2) connect database
connectDB();

// 3) middlewares
app.use(
  cors({
    origin: "*", // Allow all origins for production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 4) routes
app.use("/api/auth", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/contact", contactRoutes);     

// 5) test route
app.get("/", (req, res) => {
  res.send("🚀 API is running successfully");
});

// 5.1) health check for Render
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is healthy and running",
    timestamp: new Date().toISOString()
  });
});

// 6) global error handler (professional)
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error("❌ Stack:", err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: "Validation Error", 
      error: err.message 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid ID format" 
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      success: false, 
      message: "Duplicate entry found" 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: "Something went wrong on the server" 
  });
});

// 7) start server
const PORT = process.env.PORT || 9001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server Started on port ${PORT}`);
  console.log(`✅ Server accessible at: http://0.0.0.0:${PORT}`);
});
