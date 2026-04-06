import { GoogleGenAI } from "@google/genai";
import Question from "../models/question-model.js";
import Session from "../models/session-model.js";

// Initialize Gemini API (will be null if no API key)
const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// ============================================
// FALLBACK QUESTION SYSTEM
// ============================================
// Predefined question templates for fallback when Gemini fails
const fallbackQuestions = [
  {
    question: (role, topics) => `Can you describe your experience working with ${topics || 'modern technologies'} in ${role || 'software development'}?`,
    category: 'experience'
  },
  {
    question: (role, topics) => `What is your approach to debugging and troubleshooting complex issues in ${role || 'development'}?`,
    category: 'technical'
  },
  {
    question: (role, topics) => `How do you stay updated with the latest trends and best practices in ${topics || 'technology'}?`,
    category: 'learning'
  },
  {
    question: (role, topics) => `Describe a challenging project you worked on and how you overcame obstacles.`,
    category: 'problem-solving'
  },
  {
    question: (role, topics) => `How do you handle tight deadlines and pressure in ${role || 'development'} projects?`,
    category: 'pressure'
  },
  {
    question: (role, topics) => `Explain a technical concept you're passionate about in simple terms.`,
    category: 'communication'
  },
  {
    question: (role, topics) => `What tools, frameworks, or methodologies do you prefer and why?`,
    category: 'tools'
  },
  {
    question: (role, topics) => `How do you ensure code quality and maintainability in your projects?`,
    category: 'quality'
  },
  {
    question: (role, topics) => `Describe a situation where you had to work with a difficult team member. How did you handle it?`,
    category: 'teamwork'
  },
  {
    question: (role, topics) => `What are the key challenges you've faced in ${role || 'software development'} and how did you solve them?`,
    category: 'challenges'
  }
];

// Generate a random fallback question
const generateFallbackQuestion = (role, experience, topicsToFocus) => {
  const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
  const selected = fallbackQuestions[randomIndex];
  
  return {
    question: selected.question(role, topicsToFocus),
    category: selected.category,
    source: 'fallback'
  };
};

// ============================================
// GEMINI API INTEGRATION
// ============================================
// Generate question using Gemini API
const generateGeminiQuestion = async (role, experience, topicsToFocus) => {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const prompt = `Generate 1 interview question for a ${role} position with ${experience} experience level. 
${topicsToFocus ? `Focus on the topic: ${topicsToFocus}.` : ''}

Requirements:
- The question should be professional and relevant to the role
- Make it open-ended to allow detailed response
- Do not include answers or explanations, just the question

Return ONLY the question text, nothing else.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const questionText = parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!questionText || questionText.length < 10) {
      throw new Error('Invalid response from Gemini API');
    }

    return {
      question: questionText,
      category: 'gemini-generated',
      source: 'gemini'
    };
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

// ============================================
// HYBRID QUESTION GENERATION (MAIN FUNCTION)
// ============================================
// Try Gemini first, fall back to random if it fails
const generateQuestionHybrid = async (role, experience, topicsToFocus) => {
  // Try Gemini API first
  if (genAI) {
    try {
      console.log('🤖 Attempting to generate question with Gemini API...');
      const geminiResult = await generateGeminiQuestion(role, experience, topicsToFocus);
      console.log('✅ Gemini question generated successfully');
      return geminiResult;
    } catch (error) {
      console.log('⚠️ Gemini failed, using fallback:', error.message);
      // Fall through to fallback
    }
  } else {
    console.log('⚠️ Gemini not configured, using fallback question');
  }

  // Use fallback random question
  const fallbackResult = generateFallbackQuestion(role, experience, topicsToFocus);
  console.log('✅ Fallback question generated');
  return fallbackResult;
};

// @desc    Generate + SAVE a single interview question for a session
// @route   POST /api/ai/generate-questions
// @access  Private
export const generateInterviewQuestions = async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log('🔍 Generating single question for session:', sessionId);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }

    // Fetch session to get role, experience, topicsToFocus
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Check authorization
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const { role, experience, topicsToFocus } = session;

    // Check 10-question limit
    const existingQuestions = session.questions || [];
    if (existingQuestions.length >= 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 questions reached. Please complete the interview to get your evaluation.",
        limitReached: true
      });
    }

    // Generate question using hybrid system (Gemini + Fallback)
    const questionData = await generateQuestionHybrid(role, experience, topicsToFocus);
    console.log('📝 Generated question:', questionData.question);
    console.log('📊 Source:', questionData.source);

    // Save single question to DB
    const savedQuestion = await Question.create({
      session: sessionId,
      question: questionData.question,
      answer: "",
      note: "",
      isPinned: false,
    });

    console.log('💾 Question saved to DB:', savedQuestion._id);

    // Attach question ID to session
    session.questions.push(savedQuestion._id);
    await session.save();
    console.log('✅ Session updated with question ID');

    res.status(201).json({
      success: true,
      data: [savedQuestion],
      source: questionData.source,
      message: "Question generated successfully"
    });
  } catch (error) {
    console.error("❌ Error generating question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate question",
      error: error.message,
    });
  }
};

// @desc    Generate explanation for an interview question
// @route   POST /api/ai/generate-explanation
// @access  Private
export const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    let explanation;
    let source = 'fallback';

    // Try Gemini first
    if (genAI) {
      try {
        const prompt = `Provide a brief explanation or guidance on how to answer this interview question: "${question}". 
Give 2-3 key points the candidate should cover in their answer. Keep it concise.`;

        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const aiExplanation = parts
          .filter((p) => !p.thought)
          .map((p) => p.text ?? "")
          .join("")
          .trim();

        if (aiExplanation && aiExplanation.length > 20) {
          explanation = {
            title: "Interview Question Analysis",
            explanation: aiExplanation
          };
          source = 'gemini';
        }
      } catch (error) {
        console.log('⚠️ Gemini explanation failed, using fallback');
      }
    }

    // Use fallback if Gemini failed or not configured
    if (!explanation) {
      explanation = {
        title: "Interview Question Analysis",
        explanation: `When answering "${question}", focus on being specific and providing concrete examples from your experience. Show how you think through problems and demonstrate your expertise. Remember to use the STAR method (Situation, Task, Action, Result) for behavioral questions.`,
      };
    }

    res.status(200).json({
      success: true,
      data: explanation,
      source: source
    });
  } catch (error) {
    console.error("❌ Error generating explanation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};

// @desc    Generate feedback for an interview answer
// @route   POST /api/ai/generate-feedback
// @access  Private
export const generateFeedback = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    let feedback;
    let source = 'fallback';

    // Try Gemini first for AI-powered feedback
    if (genAI) {
      try {
        const prompt = `Analyze this interview answer and provide feedback:

Question: "${question}"
Answer: "${answer}"

Provide a JSON response with this structure:
{
  "score": number (1-10),
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "overall": "brief overall assessment"
}`;

        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const rawText = parts
          .filter((p) => !p.thought)
          .map((p) => p.text ?? "")
          .join("")
          .trim();

        // Try to parse JSON response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedFeedback = JSON.parse(jsonMatch[0]);
          if (parsedFeedback.score && parsedFeedback.strengths) {
            feedback = parsedFeedback;
            source = 'gemini';
          }
        }
      } catch (error) {
        console.log('⚠️ Gemini feedback failed, using fallback');
      }
    }

    // Use fallback if Gemini failed
    if (!feedback) {
      feedback = {
        score: 7,
        strengths: [
          'Good structure in your answer',
          'Clear communication',
          'Relevant examples mentioned'
        ],
        improvements: [
          'Could provide more specific details',
          'Consider quantifying your achievements',
          'Add more context about the impact'
        ],
        overall: 'Solid answer with room for more detail. Keep practicing!'
      };
    }

    res.status(200).json({
      success: true,
      data: feedback,
      source: source
    });
  } catch (error) {
    console.error("❌ Error generating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate feedback",
      error: error.message,
    });
  }
};

// @desc    Evaluate all answers for a completed interview
// @route   POST /api/ai/evaluate-interview
// @access  Private
export const evaluateInterview = async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log('🔍 Evaluating interview for session:', sessionId);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }

    // Fetch session with all questions
    const session = await Session.findById(sessionId).populate('questions');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Check authorization
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Check if at least 5 questions answered
    const questions = session.questions || [];
    const answeredQuestions = questions.filter(q => q.answer && q.answer.trim().length > 0);
    
    if (answeredQuestions.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please answer at least 5 questions before evaluation"
      });
    }

    let evaluation;
    let source = 'fallback';

    // Try Gemini first for AI-powered evaluation
    if (genAI) {
      try {
        const questionsAndAnswers = answeredQuestions.map((q, index) => 
          `Q${index + 1}: ${q.question}\nA${index + 1}: ${q.answer}`
        ).join('\n\n');

        const prompt = `Evaluate these interview answers and provide comprehensive feedback:

${questionsAndAnswers}

Provide a JSON response with this structure:
{
  "score": number (1-100),
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "overall": "detailed overall assessment (2-3 sentences)",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "questionsAnswered": ${answeredQuestions.length},
  "totalQuestions": ${questions.length}
}

Be fair, constructive, and specific in your evaluation.`;

        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const rawText = parts
          .filter((p) => !p.thought)
          .map((p) => p.text ?? "")
          .join("")
          .trim();

        // Try to parse JSON response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedEvaluation = JSON.parse(jsonMatch[0]);
          if (parsedEvaluation.score && parsedEvaluation.strengths) {
            evaluation = parsedEvaluation;
            source = 'gemini';
          }
        }
      } catch (error) {
        console.log('⚠️ Gemini evaluation failed, using fallback');
      }
    }

    // Use fallback if Gemini failed
    if (!evaluation) {
      const score = Math.min(85, 60 + answeredQuestions.length * 3); // Base score + bonus for more answers
      
      evaluation = {
        score: score,
        strengths: [
          'Good attempt at answering questions',
          'Shows interest in the role',
          answeredQuestions.length >= 8 ? 'Comprehensive coverage of topics' : 'Partial completion of interview'
        ],
        weaknesses: [
          'Could provide more specific examples',
          'Answers could be more detailed',
          'Consider using STAR method for behavioral questions'
        ],
        overall: `You answered ${answeredQuestions.length} out of ${questions.length} questions. Good effort overall with room for improvement in answer depth and specificity.`,
        recommendations: [
          'Practice with more technical questions',
          'Prepare specific examples from your experience',
          'Research common interview questions for your role'
        ],
        questionsAnswered: answeredQuestions.length,
        totalQuestions: questions.length
      };
    }

    // Mark session as evaluated
    session.evaluated = true;
    session.evaluation = evaluation;
    session.evaluationSource = source;
    await session.save();

    console.log('✅ Interview evaluation completed');
    console.log('📊 Score:', evaluation.score);
    console.log('🎯 Source:', source);

    res.status(200).json({
      success: true,
      data: evaluation,
      source: source,
      message: "Interview evaluated successfully"
    });
  } catch (error) {
    console.error("❌ Error evaluating interview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to evaluate interview",
      error: error.message,
    });
  }
};
