import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("📍 Database host: mongodb+srv://...");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const connection = await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Connected to database: ${connection.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔌 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("💡 TROUBLESHOOTING STEPS:");
    console.error("1. Verify MONGO_URI is set in Render environment variables");
    console.error("2. Verify MongoDB Atlas credentials are correct");
    console.error("3. Verify IP address is whitelisted in MongoDB Atlas");
    console.error("   (Use 0.0.0.0/0 for all IPs or add Render's IP)");
    console.error("4. Test connection locally with same MONGO_URI");
    process.exit(1);
  }
};

export default connectDB;
