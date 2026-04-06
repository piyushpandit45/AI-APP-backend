import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    note: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Question = mongoose.model("Question", questionsSchema);

export default Question;