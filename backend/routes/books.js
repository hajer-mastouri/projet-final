const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const Book = require('../models/Book');
const Rating = require('../models/Rating');
const Review = require('../models/Review');
const ReadingList = require('../models/ReadingList');

// Validation middleware
const validateRating = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
];

const validateReview = [
  body('text')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Review must be between 10 and 2000 characters')
];

const validateReadingListUpdate = [
  body('status')
    .optional()
    .isIn(['want-to-read', 'currently-reading', 'read'])
    .withMessage('Status must be want-to-read, currently-reading, or read'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// GET /api/books/:googleBooksId - Get book details
router.get('/:googleBooksId', async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    
    let book = await Book.findOne({ googleBooksId });
    
    if (book) {
      // Increment view count
      await book.incrementViewCount();
      
      // Get additional data
      const ratingStats = await Rating.getBookAverageRating(googleBooksId);
      const reviewStats = await Review.getBookReviewStats(googleBooksId);
      
      res.json({
        success: true,
        book: {
          ...book.toObject(),
          ...ratingStats,
          ...reviewStats
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Book not found in database'
      });
    }
  } catch (error) {
    console.error('Get book details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching book details'
    });
  }
});

// POST /api/books - Save book details from Google Books API
router.post('/', async (req, res) => {
  try {
    const bookData = req.body;
    
    // Create or update book
    let book = await Book.findOne({ googleBooksId: bookData.googleBooksId });
    
    if (!book) {
      book = new Book(bookData);
      await book.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Book saved successfully',
      book
    });
  } catch (error) {
    console.error('Save book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving book'
    });
  }
});

// GET /api/books/:googleBooksId/rating - Get user's rating for a book
router.get('/:googleBooksId/rating', auth, async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    const userId = req.user.userId;
    
    const rating = await Rating.getUserRating(userId, googleBooksId);
    
    res.json({
      success: true,
      rating
    });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rating'
    });
  }
});

// POST /api/books/:googleBooksId/rating - Rate a book
router.post('/:googleBooksId/rating', auth, validateRating, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { googleBooksId } = req.params;
    const { rating } = req.body;
    const userId = req.user.userId;
    
    // Find or create book
    let book = await Book.findOne({ googleBooksId });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Create or update rating
    let userRating = await Rating.findOne({ userId, googleBooksId });
    
    if (userRating) {
      userRating.rating = rating;
      await userRating.save();
    } else {
      userRating = new Rating({
        userId,
        bookId: book._id,
        googleBooksId,
        rating
      });
      await userRating.save();
    }
    
    // Get updated rating statistics
    const ratingStats = await Rating.getBookAverageRating(googleBooksId);
    
    res.json({
      success: true,
      message: 'Rating saved successfully',
      rating,
      ...ratingStats
    });
  } catch (error) {
    console.error('Rate book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving rating'
    });
  }
});

// GET /api/books/:googleBooksId/reading-list - Check if book is in user's reading list
router.get('/:googleBooksId/reading-list', auth, async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    const userId = req.user.userId;
    
    const status = await ReadingList.isInUserList(userId, googleBooksId);
    
    res.json({
      success: true,
      inList: !!status,
      status
    });
  } catch (error) {
    console.error('Check reading list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking reading list'
    });
  }
});

// POST /api/books/:googleBooksId/reading-list - Add book to reading list
router.post('/:googleBooksId/reading-list', auth, async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    const { title, authors, imageLinks } = req.body;
    const userId = req.user.userId;
    
    // Find or create book
    let book = await Book.findOne({ googleBooksId });
    if (!book) {
      book = new Book({
        googleBooksId,
        title,
        authors: authors || [],
        imageLinks: imageLinks || {}
      });
      await book.save();
    }
    
    // Check if already in list
    let readingListEntry = await ReadingList.findOne({ userId, googleBooksId });
    
    if (readingListEntry) {
      return res.status(400).json({
        success: false,
        message: 'Book is already in your reading list'
      });
    }
    
    // Add to reading list
    readingListEntry = new ReadingList({
      userId,
      bookId: book._id,
      googleBooksId,
      status: 'want-to-read'
    });
    
    await readingListEntry.save();
    
    res.status(201).json({
      success: true,
      message: 'Book added to reading list',
      entry: readingListEntry
    });
  } catch (error) {
    console.error('Add to reading list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to reading list'
    });
  }
});

// DELETE /api/books/:googleBooksId/reading-list - Remove book from reading list
router.delete('/:googleBooksId/reading-list', auth, async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    const userId = req.user.userId;
    
    const result = await ReadingList.findOneAndDelete({ userId, googleBooksId });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in reading list'
      });
    }
    
    res.json({
      success: true,
      message: 'Book removed from reading list'
    });
  } catch (error) {
    console.error('Remove from reading list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from reading list'
    });
  }
});

// GET /api/books/:googleBooksId/reviews - Get reviews for a book
router.get('/:googleBooksId/reviews', async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    const reviews = await Review.getBookReviews(googleBooksId, {
      page,
      limit,
      sortBy,
      sortOrder
    });
    
    const totalReviews = await Review.countDocuments({
      googleBooksId,
      isPublic: true,
      isModerated: false
    });
    
    const totalPages = Math.ceil(totalReviews / limit);
    
    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalReviews,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
});

// POST /api/books/:googleBooksId/reviews - Add a review for a book
router.post('/:googleBooksId/reviews', auth, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { googleBooksId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;
    
    // Find or create book
    let book = await Book.findOne({ googleBooksId });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Check if user already reviewed this book
    const existingReview = await Review.findOne({ userId, googleBooksId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this book'
      });
    }
    
    // Create review
    const review = new Review({
      userId,
      bookId: book._id,
      googleBooksId,
      text
    });
    
    await review.save();
    
    // Populate user data for response
    await review.populate('user', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding review'
    });
  }
});

// GET /api/books/:googleBooksId/stats - Get book statistics
router.get('/:googleBooksId/stats', async (req, res) => {
  try {
    const { googleBooksId } = req.params;

    const book = await Book.findOne({ googleBooksId });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const ratingStats = await Rating.getBookAverageRating(googleBooksId);
    const reviewStats = await Review.getBookReviewStats(googleBooksId);
    const ratingDistribution = await Rating.getRatingDistribution(googleBooksId);

    res.json({
      success: true,
      stats: {
        ...ratingStats,
        ...reviewStats,
        ratingDistribution,
        viewCount: book.viewCount,
        addedToListCount: book.addedToListCount
      }
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching book statistics'
    });
  }
});

// GET /api/books/popular - Get popular books
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const books = await Book.getPopular(limit);

    res.json({
      success: true,
      books
    });
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular books'
    });
  }
});

// GET /api/books/recently-rated - Get recently rated books
router.get('/recently-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const books = await Book.getRecentlyRated(limit);

    res.json({
      success: true,
      books
    });
  } catch (error) {
    console.error('Get recently rated books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recently rated books'
    });
  }
});

// GET /api/books/reading-list - Get user's reading list
router.get('/reading-list', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const readingList = await ReadingList.getUserReadingList(userId, {
      status,
      page,
      limit,
      sortBy,
      sortOrder
    });

    const totalQuery = { userId };
    if (status) totalQuery.status = status;

    const totalItems = await ReadingList.countDocuments(totalQuery);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      readingList,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get reading list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reading list'
    });
  }
});

module.exports = router;
