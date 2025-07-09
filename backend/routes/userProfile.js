const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken: auth, optionalAuth } = require('../middleware/auth');
const User = require('../models/User');
const BookRecommendation = require('../models/BookRecommendation');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Follow = require('../models/Follow');
const Rating = require('../models/Rating');
const ReadingList = require('../models/ReadingList');

// Validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Website must be a valid URL')
];

// GET /api/users/profile/:userId - Get user profile
router.get('/profile/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;
    
    const user = await User.findById(userId).select('-password -email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check privacy settings
    if (user.isPrivate && currentUserId !== userId) {
      // Check if current user follows this user
      const isFollowing = currentUserId ? 
        await Follow.isFollowing(currentUserId, userId) : false;
      
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This profile is private'
        });
      }
    }
    
    // Get additional profile data
    const [followStats, recentActivity] = await Promise.all([
      Follow.getFollowStats(userId),
      getRecentUserActivity(userId, 5)
    ]);
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        ...followStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
});

// PUT /api/users/profile - Update current user's profile
router.put('/profile', auth, validateProfileUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const userId = req.user.userId;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated here
    delete updateData.email;
    delete updateData.password;
    delete updateData.followersCount;
    delete updateData.followingCount;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// GET /api/users/:userId/stats - Get user statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [
      recommendationsCount,
      ratingsStats,
      readingListStats,
      likesReceived,
      commentsCount
    ] = await Promise.all([
      BookRecommendation.countDocuments({ userId, status: 'published' }),
      getUserRatingStats(userId),
      ReadingList.getUserReadingStats(userId),
      getLikesReceivedCount(userId),
      Comment.countDocuments({ userId, isPublic: true, isModerated: false })
    ]);
    
    res.json({
      success: true,
      stats: {
        recommendationsCount,
        ...ratingsStats,
        ...readingListStats,
        likesReceived,
        commentsCount
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// GET /api/users/:userId/recommendations - Get user's recommendations
router.get('/:userId/recommendations', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const recommendations = await BookRecommendation.find({
      userId,
      status: 'published',
      isPublic: true
    })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name profilePicture');
    
    const totalRecommendations = await BookRecommendation.countDocuments({
      userId,
      status: 'published',
      isPublic: true
    });
    
    const totalPages = Math.ceil(totalRecommendations / limit);
    
    res.json({
      success: true,
      recommendations,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalRecommendations,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user recommendations'
    });
  }
});

// GET /api/users/:userId/comments - Get user's comments
router.get('/:userId/comments', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const comments = await Comment.getUserComments(userId, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    const totalComments = await Comment.countDocuments({
      userId,
      isPublic: true,
      isModerated: false
    });
    
    const totalPages = Math.ceil(totalComments / limit);
    
    res.json({
      success: true,
      comments,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalComments,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user comments'
    });
  }
});

// GET /api/users/:userId/reading-list - Get user's reading list
router.get('/:userId/reading-list', async (req, res) => {
  try {
    const { userId } = req.params;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const readingList = await ReadingList.getUserReadingList(userId, {
      status,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
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
    console.error('Get user reading list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user reading list'
    });
  }
});

// GET /api/users/:userId/activity - Get user's activity feed
router.get('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const activity = await getRecentUserActivity(userId, limit, page);
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user activity'
    });
  }
});

// GET /api/users/search - Search users
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ],
      isPrivate: false
    })
      .select('name bio profilePicture location followersCount')
      .sort({ followersCount: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalUsers = await User.countDocuments({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ],
      isPrivate: false
    });
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// Helper functions
async function getUserRatingStats(userId) {
  const ratingStats = await Rating.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        booksRated: { $addToSet: '$bookId' }
      }
    }
  ]);
  
  const currentYear = new Date().getFullYear();
  const booksReadThisYear = await Rating.countDocuments({
    userId,
    createdAt: {
      $gte: new Date(currentYear, 0, 1),
      $lt: new Date(currentYear + 1, 0, 1)
    }
  });
  
  return ratingStats.length > 0 ? {
    totalRatings: ratingStats[0].totalRatings,
    averageRating: ratingStats[0].averageRating,
    totalBooksRead: ratingStats[0].booksRated.length,
    booksReadThisYear
  } : {
    totalRatings: 0,
    averageRating: 0,
    totalBooksRead: 0,
    booksReadThisYear
  };
}

async function getLikesReceivedCount(userId) {
  const likesReceived = await Like.aggregate([
    {
      $lookup: {
        from: 'bookrecommendations',
        localField: 'recommendationId',
        foreignField: '_id',
        as: 'recommendation'
      }
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'commentId',
        foreignField: '_id',
        as: 'comment'
      }
    },
    {
      $match: {
        $or: [
          { 'recommendation.userId': new mongoose.Types.ObjectId(userId) },
          { 'comment.userId': new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    { $count: 'total' }
  ]);
  
  return likesReceived.length > 0 ? likesReceived[0].total : 0;
}

async function getRecentUserActivity(userId, limit = 10, page = 1) {
  const skip = (page - 1) * limit;
  
  // Get recent recommendations, comments, and likes
  const [recentRecommendations, recentComments, recentLikes] = await Promise.all([
    BookRecommendation.find({ userId, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title author createdAt'),
    Comment.find({ userId, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('recommendationId', 'title')
      .select('text createdAt'),
    Like.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('recommendationId', 'title')
      .select('createdAt')
  ]);
  
  // Combine and sort all activities
  const activities = [
    ...recentRecommendations.map(rec => ({
      type: 'recommendation',
      data: rec,
      createdAt: rec.createdAt
    })),
    ...recentComments.map(comment => ({
      type: 'comment',
      data: comment,
      createdAt: comment.createdAt
    })),
    ...recentLikes.map(like => ({
      type: 'like',
      data: like,
      createdAt: like.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
   .slice(skip, skip + limit);
  
  return activities;
}

module.exports = router;
