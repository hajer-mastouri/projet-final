const express = require('express');
const router = express.Router();
const BookRecommendation = require('../models/BookRecommendation');
const { authenticateToken: auth } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Validation middleware
const validateRecommendation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  
  body('genre')
    .isIn([
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
      'Fantasy', 'Thriller', 'Biography', 'History', 'Self-Help',
      'Business', 'Technology', 'Health', 'Travel', 'Cooking',
      'Art', 'Poetry', 'Drama', 'Horror', 'Adventure'
    ])
    .withMessage('Please select a valid genre'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('recommendationReason')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Recommendation reason must be between 20 and 1000 characters'),
  
  body('isbn')
    .optional()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please enter a valid ISBN'),
  
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Published year must be valid'),
  
  body('pageCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page count must be a positive number'),
  
  body('coverUrl')
    .optional()
    .isURL()
    .withMessage('Cover URL must be a valid URL'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('personalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Personal notes cannot exceed 1000 characters')
];

// GET /api/recommendations/genres/stats - Get genre statistics
router.get('/genres/stats', async (req, res) => {
  try {
    const stats = await BookRecommendation.aggregate([
      { $match: { status: 'published', isPublic: true } },
      { $group: {
          _id: '$genre',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Get genre stats error:', error);
    res.status(500).json({ message: 'Server error while fetching genre statistics' });
  }
});

// GET /api/recommendations - Get all public recommendations with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      minRating = 1,
      maxRating = 5,
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const searchOptions = {
      genre,
      minRating: parseInt(minRating),
      maxRating: parseInt(maxRating),
      tags: tags ? tags.split(',') : undefined,
      limit: parseInt(limit),
      skip,
      sortBy,
      sortOrder: sortDirection
    };

    let recommendations;
    let total;

    if (featured === 'true') {
      recommendations = await BookRecommendation.getFeatured(parseInt(limit));
      total = await BookRecommendation.countDocuments({ 
        featured: true, 
        status: 'published', 
        isPublic: true 
      });
    } else {
      recommendations = await BookRecommendation.searchRecommendations(search, searchOptions);
      
      // Count total for pagination
      const countQuery = {
        status: 'published',
        isPublic: true,
        rating: { $gte: parseInt(minRating), $lte: parseInt(maxRating) }
      };
      
      if (search) countQuery.$text = { $search: search };
      if (genre) countQuery.genre = genre;
      if (tags) countQuery.tags = { $in: tags.split(',') };
      
      total = await BookRecommendation.countDocuments(countQuery);
    }

    res.json({
      recommendations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error while fetching recommendations' });
  }
});

// GET /api/recommendations/my - Get current user's recommendations
router.get('/my', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'published',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const query = { userId: req.user.id };
    if (status !== 'all') {
      query.status = status;
    }

    const recommendations = await BookRecommendation.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username email');

    const total = await BookRecommendation.countDocuments(query);

    res.json({
      recommendations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user recommendations error:', error);
    res.status(500).json({ message: 'Server error while fetching your recommendations' });
  }
});

// GET /api/recommendations/:id - Get single recommendation
router.get('/:id', async (req, res) => {
  try {
    const recommendation = await BookRecommendation.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('comments.userId', 'username email');

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Check if recommendation is public or user owns it
    const isOwner = req.user && req.user.id === recommendation.userId._id.toString();
    if (!recommendation.isPublic && !isOwner) {
      return res.status(403).json({ message: 'This recommendation is private' });
    }

    // Increment view count if not the owner
    if (!isOwner) {
      recommendation.viewCount += 1;
      await recommendation.save();
    }

    res.json(recommendation);
  } catch (error) {
    console.error('Get recommendation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }
    res.status(500).json({ message: 'Server error while fetching recommendation' });
  }
});

// POST /api/recommendations - Create new recommendation
router.post('/', auth, validateRecommendation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const recommendationData = {
      ...req.body,
      userId: req.user.id
    };

    const recommendation = new BookRecommendation(recommendationData);
    await recommendation.save();

    // Populate user data for response
    await recommendation.populate('userId', 'username email');

    res.status(201).json({
      message: 'Recommendation created successfully',
      recommendation
    });
  } catch (error) {
    console.error('Create recommendation error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation failed',
        errors
      });
    }
    res.status(500).json({ message: 'Server error while creating recommendation' });
  }
});

// PUT /api/recommendations/:id - Update recommendation
router.put('/:id', auth, validateRecommendation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const recommendation = await BookRecommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Check if user owns the recommendation
    if (recommendation.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this recommendation' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId') { // Prevent changing the owner
        recommendation[key] = req.body[key];
      }
    });

    await recommendation.save();
    await recommendation.populate('userId', 'username email');

    res.json({
      message: 'Recommendation updated successfully',
      recommendation
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation failed',
        errors
      });
    }
    res.status(500).json({ message: 'Server error while updating recommendation' });
  }
});

// DELETE /api/recommendations/:id - Delete recommendation
router.delete('/:id', auth, async (req, res) => {
  try {
    const recommendation = await BookRecommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Check if user owns the recommendation
    if (recommendation.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this recommendation' });
    }

    await BookRecommendation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }
    res.status(500).json({ message: 'Server error while deleting recommendation' });
  }
});

// POST /api/recommendations/:id/like - Toggle like on recommendation
router.post('/:id/like', auth, async (req, res) => {
  try {
    const recommendation = await BookRecommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    if (!recommendation.isPublic) {
      return res.status(403).json({ message: 'Cannot like a private recommendation' });
    }

    const isLiked = recommendation.isLikedBy(req.user.id);

    if (isLiked) {
      await recommendation.removeLike(req.user.id);
      res.json({
        message: 'Like removed',
        liked: false,
        likeCount: recommendation.likeCount
      });
    } else {
      await recommendation.addLike(req.user.id);
      res.json({
        message: 'Like added',
        liked: true,
        likeCount: recommendation.likeCount
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }
    res.status(500).json({ message: 'Server error while toggling like' });
  }
});

// POST /api/recommendations/:id/comments - Add comment to recommendation
router.post('/:id/comments', auth, [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const recommendation = await BookRecommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    if (!recommendation.isPublic) {
      return res.status(403).json({ message: 'Cannot comment on a private recommendation' });
    }

    await recommendation.addComment(req.user.id, req.body.comment);
    await recommendation.populate('comments.userId', 'username email');

    const newComment = recommendation.comments[recommendation.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
      commentCount: recommendation.commentCount
    });
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

module.exports = router;
