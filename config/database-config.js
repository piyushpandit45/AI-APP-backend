import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✅ MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("💡 Please check your MONGO_URI in .env file");
    process.exit(1);
  }
};

export default connectDB;
