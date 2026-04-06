import express from "express";
import {
  generateInterviewQuestions,
  generateConceptExplanation,
  generateFeedback,
  evaluateInterview
} from "../controller/ai-controller.js";
import { protect } from "../middlewares/auth-middleware.js";

const router = express.Router();

// AI Routes
router.post("/generate-questions", protect, generateInterviewQuestions);
router.post("/generate-explanation", protect, generateConceptExplanation);
router.post("/generate-feedback", protect, generateFeedback);
router.post("/evaluate-interview", protect, evaluateInterview);

export default router;