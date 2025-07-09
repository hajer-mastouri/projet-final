const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['recommendation', 'comment', 'review'],
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  // For polymorphic references
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookRecommendation',
    index: true
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes to prevent duplicate likes and optimize queries
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
likeSchema.index({ userId: 1, createdAt: -1 });

// Virtual to populate user details
likeSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static method to toggle like
likeSchema.statics.toggleLike = async function(userId, targetType, targetId) {
  const existingLike = await this.findOne({ userId, targetType, targetId });
  
  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    return { liked: false, like: null };
  } else {
    // Like
    const likeData = {
      userId,
      targetType,
      targetId
    };
    
    // Set the appropriate reference field
    if (targetType === 'recommendation') {
      likeData.recommendationId = targetId;
    } else if (targetType === 'comment') {
      likeData.commentId = targetId;
    } else if (targetType === 'review') {
      likeData.reviewId = targetId;
    }
    
    const like = new this(likeData);
    await like.save();
    return { liked: true, like };
  }
};

// Static method to check if user liked something
likeSchema.statics.isLikedByUser = async function(userId, targetType, targetId) {
  const like = await this.findOne({ userId, targetType, targetId });
  return !!like;
};

// Static method to get like count for target
likeSchema.statics.getLikeCount = async function(targetType, targetId) {
  return await this.countDocuments({ targetType, targetId });
};

// Static method to get users who liked something
likeSchema.statics.getLikers = async function(targetType, targetId, limit = 10) {
  return await this.find({ targetType, targetId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get user's liked items
likeSchema.statics.getUserLikes = async function(userId, targetType = null, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const query = { userId };
  if (targetType) {
    query.targetType = targetType;
  }
  
  return await this.find(query)
    .populate('recommendationId', 'title author description rating coverUrl')
    .populate('commentId', 'text createdAt')
    .populate('reviewId', 'text rating createdAt')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get like statistics for user
likeSchema.statics.getUserLikeStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$targetType',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    recommendation: 0,
    comment: 0,
    review: 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Post-save middleware to update target's like count
likeSchema.post('save', async function() {
  try {
    await updateTargetLikeCount(this.targetType, this.targetId);
  } catch (error) {
    console.error('Error updating like count:', error);
  }
});

// Post-remove middleware to update target's like count
likeSchema.post('deleteOne', { document: true }, async function() {
  try {
    await updateTargetLikeCount(this.targetType, this.targetId);
  } catch (error) {
    console.error('Error updating like count after removal:', error);
  }
});

// Helper function to update like count on target document
async function updateTargetLikeCount(targetType, targetId) {
  const Like = mongoose.model('Like');
  const likeCount = await Like.countDocuments({ targetType, targetId });
  
  let Model;
  switch (targetType) {
    case 'recommendation':
      Model = mongoose.model('BookRecommendation');
      break;
    case 'comment':
      Model = mongoose.model('Comment');
      break;
    case 'review':
      Model = mongoose.model('Review');
      break;
    default:
      return;
  }
  
  if (Model) {
    await Model.findByIdAndUpdate(targetId, { likeCount });
  }
}

module.exports = mongoose.model('Like', likeSchema);
