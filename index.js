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

// 🔐 VALIDATE REQUIRED ENVIRONMENT VARIABLES
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
  console.error(
    `❌ CRITICAL: Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error(
    "\n🚨 RENDER DEPLOYMENT STEPS:"
  );
  console.error("1. Go to Render Dashboard");
  console.error("2. Click on your service");
  console.error("3. Go to 'Environment' section");
  console.error("4. Add these variables:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}=<your_value>`);
  });
  console.error("\n5. Deploy again");
  process.exit(1);
}

console.log("✅ All required environment variables are set");

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

// 4.1) diagnostic endpoint (PRODUCTION DEBUG)
app.get("/api/diagnostics", (req, res) => {
  res.status(200).json({
    status: "OK",
    server: {
      port: process.env.PORT || 9001,
      environment: process.env.NODE_ENV || "production",
      uptime: process.uptime(),
    },
    database: {
      connected: require("mongoose").connection.readyState === 1,
      dbName: require("mongoose").connection.name || "unknown",
    },
    environment: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

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
  console.log("\n" + "=".repeat(60));
  console.log("✅ SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "production"}`);
  console.log(`🌐 Accessible at: http://localhost:${PORT}`);
  console.log(`🌐 From other devices: http://<your-server-ip>:${PORT}`);
  console.log(`📊 Diagnostics: GET /api/diagnostics`);
  console.log(`💼 Health Check: GET /health`);
  console.log("=".repeat(60));
  console.log("\n📌 RENDER DEPLOYMENT CHECKLIST:");
  console.log("✅ Environment Variables Set:");
  console.log(`   - MONGO_URI: ${process.env.MONGO_URI ? "✓" : "✗ MISSING"}`);
  console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? "✓" : "✗ MISSING"}`);
  console.log(`   - PORT: ${process.env.PORT ? "✓ (Render assigned)" : "✗ Using default 9001"}`);
  console.log("=".repeat(60) + "\n");
});
