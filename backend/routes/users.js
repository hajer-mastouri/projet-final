const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('favoriteGenres')
    .optional()
    .isArray()
    .withMessage('Favorite genres must be an array')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('favoriteGenres')
    .optional()
    .isArray()
    .withMessage('Favorite genres must be an array'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
];

// Authentication routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.post('/logout', authenticateToken, (req, res) => {
  // In a JWT-based system, logout is handled client-side by removing the token
  // But we can add server-side logic here if needed (like blacklisting tokens)
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateUserProfile);

// Add book to read list
router.post('/books/read', authenticateToken, async (req, res) => {
  try {
    const { title, author, rating } = req.body;
    const User = require('../models/User');

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.readBooks.push({
      title,
      author,
      rating,
      dateRead: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Book added to read list',
      readBooks: user.readBooks
    });

  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's read books
router.get('/books/read', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId).select('readBooks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      readBooks: user.readBooks
    });

  } catch (error) {
    console.error('Get read books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
