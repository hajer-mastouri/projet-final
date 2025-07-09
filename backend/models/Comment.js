const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['recommendation', 'review'],
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
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  // Reply functionality
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  },
  replyCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Social features
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Moderation
  isPublic: {
    type: Boolean,
    default: true
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    trim: true
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ isPublic: 1, isModerated: 1 });

// Virtual to populate user details
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId'
});

// Virtual for comment excerpt (first 100 characters)
commentSchema.virtual('excerpt').get(function() {
  if (this.text.length <= 100) {
    return this.text;
  }
  return this.text.substring(0, 97) + '...';
});

// Static method to get comments for a target
commentSchema.statics.getTargetComments = function(targetType, targetId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeReplies = false
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const query = {
    targetType,
    targetId,
    isPublic: true,
    isModerated: false
  };
  
  // Only get top-level comments if not including replies
  if (!includeReplies) {
    query.parentCommentId = { $exists: false };
  }
  
  return this.find(query)
    .populate('user', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get comment replies
commentSchema.statics.getCommentReplies = function(parentCommentId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'asc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({
    parentCommentId,
    isPublic: true,
    isModerated: false
  })
    .populate('user', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get user's comments
commentSchema.statics.getUserComments = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({ userId })
    .populate('recommendationId', 'title author')
    .populate('reviewId', 'text rating')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get comment statistics
commentSchema.statics.getCommentStats = async function(targetType, targetId) {
  const stats = await this.aggregate([
    {
      $match: {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
        isPublic: true,
        isModerated: false
      }
    },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalLikes: { $sum: '$likeCount' }
      }
    }
  ]);
  
  return stats.length > 0 ? {
    totalComments: stats[0].totalComments,
    totalLikes: stats[0].totalLikes
  } : {
    totalComments: 0,
    totalLikes: 0
  };
};

// Instance method to add reply
commentSchema.methods.addReply = async function(userId, text) {
  const Comment = this.constructor;
  
  const reply = new Comment({
    userId,
    targetType: this.targetType,
    targetId: this.targetId,
    recommendationId: this.recommendationId,
    reviewId: this.reviewId,
    text,
    parentCommentId: this._id
  });
  
  await reply.save();
  
  // Update reply count
  this.replyCount += 1;
  await this.save();
  
  return reply;
};

// Instance method to report comment
commentSchema.methods.report = async function(reason) {
  this.reportCount += 1;
  
  // Auto-moderate after 5 reports
  if (this.reportCount >= 5) {
    this.isModerated = true;
    this.moderationReason = 'Auto-moderated due to multiple reports';
  }
  
  await this.save();
  return this;
};

// Post-save middleware to update target's comment count
commentSchema.post('save', async function() {
  try {
    await updateTargetCommentCount(this.targetType, this.targetId);
  } catch (error) {
    console.error('Error updating comment count:', error);
  }
});

// Post-remove middleware to update target's comment count
commentSchema.post('deleteOne', { document: true }, async function() {
  try {
    await updateTargetCommentCount(this.targetType, this.targetId);
    
    // Update parent comment reply count if this is a reply
    if (this.parentCommentId) {
      const Comment = mongoose.model('Comment');
      const parentComment = await Comment.findById(this.parentCommentId);
      if (parentComment) {
        parentComment.replyCount = Math.max(0, parentComment.replyCount - 1);
        await parentComment.save();
      }
    }
  } catch (error) {
    console.error('Error updating comment count after removal:', error);
  }
});

// Helper function to update comment count on target document
async function updateTargetCommentCount(targetType, targetId) {
  const Comment = mongoose.model('Comment');
  const commentCount = await Comment.countDocuments({
    targetType,
    targetId,
    isPublic: true,
    isModerated: false
  });
  
  let Model;
  switch (targetType) {
    case 'recommendation':
      Model = mongoose.model('BookRecommendation');
      break;
    case 'review':
      Model = mongoose.model('Review');
      break;
    default:
      return;
  }
  
  if (Model) {
    await Model.findByIdAndUpdate(targetId, { commentCount });
  }
}

// Pre-save middleware for validation and sanitization
commentSchema.pre('save', function(next) {
  // Trim and clean the comment text
  this.text = this.text.trim();
  
  // Basic content filter
  const inappropriateWords = ['spam', 'fake', 'scam'];
  const lowerText = this.text.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (lowerText.includes(word)) {
      this.isModerated = true;
      this.moderationReason = 'Contains inappropriate content';
      break;
    }
  }
  
  // Set the appropriate reference field
  if (this.targetType === 'recommendation') {
    this.recommendationId = this.targetId;
  } else if (this.targetType === 'review') {
    this.reviewId = this.targetId;
  }
  
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
