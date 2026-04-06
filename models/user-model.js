import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

// Add indexes for better performance
UserSchema.index({ createdAt: -1 });

const User = mongoose.model("User", UserSchema);

export default User;
