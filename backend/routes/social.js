const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const Share = require('../models/Share');
const BookRecommendation = require('../models/BookRecommendation');

// Validation middleware
const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

const validateShare = [
  body('shareType')
    .optional()
    .isIn(['internal', 'external', 'social'])
    .withMessage('Invalid share type'),
  body('platform')
    .optional()
    .isIn(['twitter', 'facebook', 'linkedin', 'email', 'copy_link', 'internal_feed'])
    .withMessage('Invalid platform'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Share message cannot exceed 500 characters')
];

// LIKE ROUTES

// POST /api/social/like - Toggle like on a target (recommendation, comment, review)
router.post('/like', auth, async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    const userId = req.user.userId;
    
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target type and ID are required'
      });
    }
    
    if (!['recommendation', 'comment', 'review'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }
    
    const result = await Like.toggleLike(userId, targetType, targetId);
    const likeCount = await Like.getLikeCount(targetType, targetId);
    
    res.json({
      success: true,
      liked: result.liked,
      likeCount,
      message: result.liked ? 'Item liked' : 'Item unliked'
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
});

// GET /api/social/likes/:targetType/:targetId - Get likes for a target
router.get('/likes/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const likes = await Like.getLikers(targetType, targetId, limit);
    const likeCount = await Like.getLikeCount(targetType, targetId);
    
    res.json({
      success: true,
      likes,
      likeCount
    });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching likes'
    });
  }
});

// GET /api/social/user-likes - Get user's liked items
router.get('/user-likes', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetType = req.query.targetType;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const likes = await Like.getUserLikes(userId, targetType, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    const totalQuery = { userId };
    if (targetType) totalQuery.targetType = targetType;
    const totalItems = await Like.countDocuments(totalQuery);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.json({
      success: true,
      likes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user likes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user likes'
    });
  }
});

// COMMENT ROUTES

// POST /api/social/comment - Add a comment to a target
router.post('/comment', auth, validateComment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { targetType, targetId, text, parentCommentId } = req.body;
    const userId = req.user.userId;
    
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target type and ID are required'
      });
    }
    
    if (!['recommendation', 'review'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }
    
    const commentData = {
      userId,
      targetType,
      targetId,
      text
    };
    
    if (parentCommentId) {
      commentData.parentCommentId = parentCommentId;
    }
    
    const comment = new Comment(commentData);
    await comment.save();
    
    // Populate user data for response
    await comment.populate('user', 'name email profilePicture');
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// GET /api/social/comments/:targetType/:targetId - Get comments for a target
router.get('/comments/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    const comments = await Comment.getTargetComments(targetType, targetId, {
      page,
      limit,
      sortBy,
      sortOrder
    });
    
    const totalComments = await Comment.countDocuments({
      targetType,
      targetId,
      isPublic: true,
      isModerated: false,
      parentCommentId: { $exists: false }
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
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
});

// GET /api/social/comments/:commentId/replies - Get replies to a comment
router.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const replies = await Comment.getCommentReplies(commentId, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'asc'
    });
    
    const totalReplies = await Comment.countDocuments({
      parentCommentId: commentId,
      isPublic: true,
      isModerated: false
    });
    
    const totalPages = Math.ceil(totalReplies / limit);
    
    res.json({
      success: true,
      replies,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalReplies,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comment replies'
    });
  }
});

// DELETE /api/social/comments/:commentId - Delete a comment
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    await comment.deleteOne();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
});

// FOLLOW ROUTES

// POST /api/social/follow - Toggle follow for a user
router.post('/follow', auth, async (req, res) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user.userId;

    if (!followingId) {
      return res.status(400).json({
        success: false,
        message: 'Following user ID is required'
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: 'Users cannot follow themselves'
      });
    }

    const result = await Follow.toggleFollow(followerId, followingId);
    const followStats = await Follow.getFollowStats(followingId);

    res.json({
      success: true,
      following: result.following,
      followersCount: followStats.followersCount,
      message: result.following ? 'User followed' : 'User unfollowed'
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling follow'
    });
  }
});

// GET /api/social/followers/:userId - Get user's followers
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const followers = await Follow.getFollowers(userId, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    const totalFollowers = await Follow.countDocuments({
      followingId: userId,
      status: 'accepted'
    });

    const totalPages = Math.ceil(totalFollowers / limit);

    res.json({
      success: true,
      followers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalFollowers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
});

// GET /api/social/following/:userId - Get users that a user is following
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const following = await Follow.getFollowing(userId, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    const totalFollowing = await Follow.countDocuments({
      followerId: userId,
      status: 'accepted'
    });

    const totalPages = Math.ceil(totalFollowing / limit);

    res.json({
      success: true,
      following,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalFollowing,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
});

// GET /api/social/suggested-follows - Get suggested users to follow
router.get('/suggested-follows', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const suggestions = await Follow.getSuggestedFollows(userId, limit);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggested follows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggested follows'
    });
  }
});

// SHARE ROUTES

// POST /api/social/share - Share a target (recommendation, review, book)
router.post('/share', auth, validateShare, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { targetType, targetId, shareType, platform, message, sharedWithUsers } = req.body;
    const userId = req.user.userId;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target type and ID are required'
      });
    }

    if (!['recommendation', 'review', 'book'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
    }

    const share = await Share.createShare({
      userId,
      targetType,
      targetId,
      shareType: shareType || 'internal',
      platform,
      message,
      sharedWithUsers: sharedWithUsers || []
    });

    // Generate share URL
    const shareUrl = share.generateShareUrl();
    const shareText = share.generateShareText();

    res.status(201).json({
      success: true,
      message: 'Content shared successfully',
      share,
      shareUrl,
      shareText
    });
  } catch (error) {
    console.error('Share content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sharing content'
    });
  }
});

// GET /api/social/shares/:targetType/:targetId - Get shares for a target
router.get('/shares/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const shareType = req.query.shareType;

    const shares = await Share.getTargetShares(targetType, targetId, {
      page,
      limit,
      shareType
    });

    const shareStats = await Share.getShareStats(targetType, targetId);

    res.json({
      success: true,
      shares,
      shareStats
    });
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shares'
    });
  }
});

// GET /api/social/user-shares - Get user's shares
router.get('/user-shares', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const shareType = req.query.shareType;

    const shares = await Share.getUserShares(userId, {
      page,
      limit,
      shareType
    });

    const totalQuery = { userId };
    if (shareType) totalQuery.shareType = shareType;
    const totalItems = await Share.countDocuments(totalQuery);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      shares,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user shares error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user shares'
    });
  }
});

// GET /api/social/received-shares - Get shares received by user
router.get('/received-shares', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const shares = await Share.getReceivedShares(userId, {
      page,
      limit
    });

    const totalItems = await Share.countDocuments({
      sharedWithUsers: userId,
      shareType: 'internal'
    });
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      shares,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get received shares error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching received shares'
    });
  }
});

// POST /api/social/shares/:shareId/click - Track share click
router.post('/shares/:shareId/click', async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await Share.findById(shareId);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    await share.incrementClickCount();

    res.json({
      success: true,
      message: 'Click tracked',
      clickCount: share.clickCount
    });
  } catch (error) {
    console.error('Track share click error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking click'
    });
  }
});

module.exports = router;
