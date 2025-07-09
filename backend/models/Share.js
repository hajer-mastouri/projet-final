const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['recommendation', 'review', 'book'],
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
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    index: true
  },
  shareType: {
    type: String,
    required: true,
    enum: ['internal', 'external', 'social'],
    default: 'internal',
    index: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'facebook', 'linkedin', 'email', 'copy_link', 'internal_feed'],
    index: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Share message cannot exceed 500 characters']
  },
  // For internal shares (sharing within the app)
  sharedWithUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Tracking
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
shareSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
shareSchema.index({ userId: 1, shareType: 1, createdAt: -1 });
shareSchema.index({ platform: 1, createdAt: -1 });
shareSchema.index({ sharedWithUsers: 1 });

// Virtual to populate user details
shareSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static method to create a share
shareSchema.statics.createShare = async function(shareData) {
  const {
    userId,
    targetType,
    targetId,
    shareType = 'internal',
    platform,
    message,
    sharedWithUsers = []
  } = shareData;
  
  const share = new this({
    userId,
    targetType,
    targetId,
    shareType,
    platform,
    message,
    sharedWithUsers
  });
  
  // Set the appropriate reference field
  if (targetType === 'recommendation') {
    share.recommendationId = targetId;
  } else if (targetType === 'review') {
    share.reviewId = targetId;
  } else if (targetType === 'book') {
    share.bookId = targetId;
  }
  
  await share.save();
  return share;
};

// Static method to get shares for a target
shareSchema.statics.getTargetShares = function(targetType, targetId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    shareType = null
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const query = {
    targetType,
    targetId,
    isPublic: true
  };
  
  if (shareType) {
    query.shareType = shareType;
  }
  
  return this.find(query)
    .populate('user', 'name email profilePicture')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get user's shares
shareSchema.statics.getUserShares = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    shareType = null
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const query = { userId };
  if (shareType) {
    query.shareType = shareType;
  }
  
  return this.find(query)
    .populate('recommendationId', 'title author description')
    .populate('reviewId', 'text rating')
    .populate('bookId', 'title authors')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get shares received by a user
shareSchema.statics.getReceivedShares = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({
    sharedWithUsers: userId,
    shareType: 'internal'
  })
    .populate('user', 'name email profilePicture')
    .populate('recommendationId', 'title author description')
    .populate('reviewId', 'text rating')
    .populate('bookId', 'title authors')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get share statistics
shareSchema.statics.getShareStats = async function(targetType, targetId) {
  const stats = await this.aggregate([
    {
      $match: {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId)
      }
    },
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 },
        totalClicks: { $sum: '$clickCount' }
      }
    },
    {
      $group: {
        _id: null,
        totalShares: { $sum: '$count' },
        totalClicks: { $sum: '$totalClicks' },
        platforms: {
          $push: {
            platform: '$_id',
            count: '$count',
            clicks: '$totalClicks'
          }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? {
    totalShares: stats[0].totalShares,
    totalClicks: stats[0].totalClicks,
    platforms: stats[0].platforms
  } : {
    totalShares: 0,
    totalClicks: 0,
    platforms: []
  };
};

// Static method to get trending shares
shareSchema.statics.getTrendingShares = async function(options = {}) {
  const {
    timeframe = 7, // days
    limit = 20,
    targetType = null
  } = options;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  const matchQuery = {
    createdAt: { $gte: startDate },
    isPublic: true
  };
  
  if (targetType) {
    matchQuery.targetType = targetType;
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          targetType: '$targetType',
          targetId: '$targetId'
        },
        shareCount: { $sum: 1 },
        totalClicks: { $sum: '$clickCount' },
        recentShare: { $max: '$createdAt' }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$shareCount', 2] },
            '$totalClicks'
          ]
        }
      }
    },
    { $sort: { trendingScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'bookrecommendations',
        localField: '_id.targetId',
        foreignField: '_id',
        as: 'recommendation'
      }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id.targetId',
        foreignField: '_id',
        as: 'review'
      }
    },
    {
      $lookup: {
        from: 'books',
        localField: '_id.targetId',
        foreignField: '_id',
        as: 'book'
      }
    }
  ]);
};

// Instance method to increment click count
shareSchema.methods.incrementClickCount = async function() {
  this.clickCount += 1;
  await this.save();
  return this;
};

// Instance method to generate share URL
shareSchema.methods.generateShareUrl = function(baseUrl = 'http://localhost:5174') {
  const { targetType, targetId } = this;
  
  switch (targetType) {
    case 'recommendation':
      return `${baseUrl}/recommendation/${targetId}`;
    case 'review':
      return `${baseUrl}/review/${targetId}`;
    case 'book':
      return `${baseUrl}/book/${targetId}`;
    default:
      return baseUrl;
  }
};

// Instance method to generate social media share text
shareSchema.methods.generateShareText = function() {
  const { targetType, message } = this;
  
  if (message) {
    return message;
  }
  
  switch (targetType) {
    case 'recommendation':
      return 'Check out this amazing book recommendation!';
    case 'review':
      return 'Read this insightful book review!';
    case 'book':
      return 'Discover this great book!';
    default:
      return 'Check this out on our book recommendation app!';
  }
};

// Post-save middleware to update target's share count
shareSchema.post('save', async function() {
  try {
    await updateTargetShareCount(this.targetType, this.targetId);
  } catch (error) {
    console.error('Error updating share count:', error);
  }
});

// Post-remove middleware to update target's share count
shareSchema.post('deleteOne', { document: true }, async function() {
  try {
    await updateTargetShareCount(this.targetType, this.targetId);
  } catch (error) {
    console.error('Error updating share count after removal:', error);
  }
});

// Helper function to update share count on target document
async function updateTargetShareCount(targetType, targetId) {
  const Share = mongoose.model('Share');
  const shareCount = await Share.countDocuments({ targetType, targetId });
  
  let Model;
  switch (targetType) {
    case 'recommendation':
      Model = mongoose.model('BookRecommendation');
      break;
    case 'review':
      Model = mongoose.model('Review');
      break;
    case 'book':
      Model = mongoose.model('Book');
      break;
    default:
      return;
  }
  
  if (Model) {
    await Model.findByIdAndUpdate(targetId, { shareCount });
  }
}

module.exports = mongoose.model('Share', shareSchema);
