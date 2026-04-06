import express from "express";
import Question from "../models/question-model.js";
import { protect } from "../middlewares/auth-middleware.js";

const router = express.Router();

// Question Routes
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({
        success: false,
        message: "Answer is required"
      });
    }

    // Find and update question
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    // Update answer
    question.answer = answer;
    await question.save();

    console.log('✅ Answer saved for question:', id);

    res.status(200).json({
      success: true,
      data: question,
      message: "Answer saved successfully"
    });
  } catch (error) {
    console.error("❌ Error saving answer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save answer",
      error: error.message,
    });
  }
});

export default router;
