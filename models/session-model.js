import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    topicsToFocus: { type: String },
    description: { type: String },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    answers: [{ type: Object }], // Store answers array
    completedAt: { type: Date },
    score: { type: Number },
  },
  { timestamps: true },
);

// Add indexes for better performance
sessionSchema.index({ user: 1 });
sessionSchema.index({ createdAt: -1 });
sessionSchema.index({ role: 1, experience: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;