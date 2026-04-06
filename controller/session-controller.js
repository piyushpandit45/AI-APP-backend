import Question from "../models/question-model.js";
import Session from "../models/session-model.js";

export const createSession = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, description } = req.body;
    const userId = req.user._id;

    // Input validation
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Role is required and must be a non-empty string" 
      });
    }

    if (!experience || typeof experience !== 'string' || experience.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Experience is required and must be a non-empty string" 
      });
    }

    // Validate role format
    const validRoles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Software Engineer'];
    if (!validRoles.includes(role.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role. Must be one of: " + validRoles.join(", ") 
      });
    }

    // Validate experience format
    const validExperience = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'];
    if (!validExperience.includes(experience.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid experience. Must be one of: " + validExperience.join(", ") 
      });
    }

    // Validate optional fields
    if (topicsToFocus && typeof topicsToFocus !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "Topics to focus must be a string" 
      });
    }

    if (description && typeof description !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "Description must be a string" 
      });
    }

    // Create the session
    const session = await Session.create({
      user: userId,
      role: role.trim(),
      experience: experience.trim(),
      topicsToFocus: topicsToFocus?.trim() || "",
      description: description?.trim() || "",
    });

    res.status(201).json({
      success: true,
      data: {
        session,
      },
      message: "Session created successfully"
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session",
      error: error.message,
    });
  }
};

// @desc    Get all sessions for the logged-in user
// @route   GET /api/sessions/my-sessions
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("questions");

    res.status(200).json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      },
      message: "Sessions retrieved successfully"
    });
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get a session by ID with populated questions
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("questions")
      .populate("user", "name email");

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // Check if the session belongs to the logged-in user
    if (session.user._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // If no questions, generate fallback questions
    if (!session.questions || session.questions.length === 0) {
      const fallbackQuestions = [
        {
          _id: 'fallback-1',
          question: `Can you tell me about your experience with ${session.topicsToFocus || 'software development'}?`,
          answer: '',
          note: '',
          isPinned: false,
          session: session._id
        },
        {
          _id: 'fallback-2',
          question: `How would you approach solving a complex problem in ${session.role}?`,
          answer: '',
          note: '',
          isPinned: false,
          session: session._id
        },
        {
          _id: 'fallback-3',
          question: `What are the key challenges you've faced in ${session.role} roles?`,
          answer: '',
          note: '',
          isPinned: false,
          session: session._id
        }
      ];
      session.questions = fallbackQuestions;
    }

    res.status(200).json({
      success: true,
      data: {
        session,
      },
      message: "Session retrieved successfully"
    });
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update a session
// @route   PUT /api/sessions/:id
// @access  Private
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Check if the session belongs to the logged-in user
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("questions");

    res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
      },
      message: "Session updated successfully"
    });
  } catch (error) {
    console.error('❌ Error updating session:', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Check if the session belongs to the logged-in user
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Session deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting session:', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

