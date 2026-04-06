import Contact from "../models/contact-model.js";

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Public
export const createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Name is required and must be a non-empty string" 
      });
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required and must be a non-empty string" 
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required and must be a non-empty string" 
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
    }

    // Validate message length
    if (message.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: "Message must be at least 10 characters long" 
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: "Message cannot exceed 1000 characters" 
      });
    }

    // Create the contact message
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    console.log('✅ Contact message saved:', contact._id);

    res.status(201).json({
      success: true,
      data: {
        contact: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
          message: contact.message,
          createdAt: contact.createdAt
        }
      },
      message: "Message sent successfully! We'll get back to you soon."
    });
  } catch (error) {
    console.error("❌ Create contact error:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: process.env.NODE_ENV === 'development' ? error.message : "Server error"
    });
  }
};

// @desc    Get all contact messages (admin only)
// @route   GET /api/contact
// @access  Private (Admin)
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        contacts,
        count: contacts.length
      },
      message: "Contact messages retrieved successfully"
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
