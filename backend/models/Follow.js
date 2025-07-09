const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'accepted', // For now, auto-accept follows
    index: true
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate follows and optimize queries
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1, status: 1, createdAt: -1 });
followSchema.index({ followerId: 1, status: 1, createdAt: -1 });

// Virtual to populate follower details
followSchema.virtual('follower', {
  ref: 'User',
  localField: 'followerId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate following details
followSchema.virtual('following', {
  ref: 'User',
  localField: 'followingId',
  foreignField: '_id',
  justOne: true
});

// Validation to prevent self-following
followSchema.pre('save', function(next) {
  if (this.followerId.equals(this.followingId)) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});

// Static method to toggle follow
followSchema.statics.toggleFollow = async function(followerId, followingId) {
  if (followerId.toString() === followingId.toString()) {
    throw new Error('Users cannot follow themselves');
  }
  
  const existingFollow = await this.findOne({ followerId, followingId });
  
  if (existingFollow) {
    // Unfollow
    await existingFollow.deleteOne();
    return { following: false, follow: null };
  } else {
    // Follow
    const follow = new this({
      followerId,
      followingId,
      status: 'accepted' // Auto-accept for now
    });
    await follow.save();
    return { following: true, follow };
  }
};

// Static method to check if user is following another user
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({
    followerId,
    followingId,
    status: 'accepted'
  });
  return !!follow;
};

// Static method to get user's followers
followSchema.statics.getFollowers = function(userId, options = {}) {
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
    followingId: userId,
    status: 'accepted'
  })
    .populate('follower', 'name email profilePicture bio')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get users that a user is following
followSchema.statics.getFollowing = function(userId, options = {}) {
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
    followerId: userId,
    status: 'accepted'
  })
    .populate('following', 'name email profilePicture bio')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get follow statistics for a user
followSchema.statics.getFollowStats = async function(userId) {
  const [followersCount, followingCount] = await Promise.all([
    this.countDocuments({ followingId: userId, status: 'accepted' }),
    this.countDocuments({ followerId: userId, status: 'accepted' })
  ]);
  
  return {
    followersCount,
    followingCount
  };
};

// Static method to get mutual followers
followSchema.statics.getMutualFollowers = async function(userId1, userId2) {
  // Get followers of both users
  const user1Followers = await this.find({
    followingId: userId1,
    status: 'accepted'
  }).select('followerId');
  
  const user2Followers = await this.find({
    followingId: userId2,
    status: 'accepted'
  }).select('followerId');
  
  // Find intersection
  const user1FollowerIds = user1Followers.map(f => f.followerId.toString());
  const user2FollowerIds = user2Followers.map(f => f.followerId.toString());
  
  const mutualFollowerIds = user1FollowerIds.filter(id => 
    user2FollowerIds.includes(id)
  );
  
  // Get user details for mutual followers
  const User = mongoose.model('User');
  const mutualFollowers = await User.find({
    _id: { $in: mutualFollowerIds }
  }).select('name email profilePicture');
  
  return mutualFollowers;
};

// Static method to get suggested users to follow
followSchema.statics.getSuggestedFollows = async function(userId, limit = 10) {
  // Get users that the current user's followers are following
  // but the current user is not following yet
  
  const currentUserFollowing = await this.find({
    followerId: userId,
    status: 'accepted'
  }).select('followingId');
  
  const followingIds = currentUserFollowing.map(f => f.followingId);
  followingIds.push(new mongoose.Types.ObjectId(userId)); // Exclude self
  
  // Find users followed by people the current user follows
  const suggestions = await this.aggregate([
    {
      $match: {
        followerId: { $in: followingIds },
        followingId: { $nin: followingIds },
        status: 'accepted'
      }
    },
    {
      $group: {
        _id: '$followingId',
        mutualFollowersCount: { $sum: 1 }
      }
    },
    { $sort: { mutualFollowersCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        email: '$user.email',
        profilePicture: '$user.profilePicture',
        bio: '$user.bio',
        mutualFollowersCount: 1
      }
    }
  ]);
  
  return suggestions;
};

// Static method to get follow activity feed
followSchema.statics.getFollowActivity = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Get users that the current user is following
  const following = await this.find({
    followerId: userId,
    status: 'accepted'
  }).select('followingId');
  
  const followingIds = following.map(f => f.followingId);
  
  // Get recent follow activities from followed users
  return this.find({
    followerId: { $in: followingIds },
    status: 'accepted'
  })
    .populate('follower', 'name profilePicture')
    .populate('following', 'name profilePicture')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Post-save middleware to update user follow counts
followSchema.post('save', async function() {
  try {
    await updateUserFollowCounts(this.followerId, this.followingId);
  } catch (error) {
    console.error('Error updating follow counts:', error);
  }
});

// Post-remove middleware to update user follow counts
followSchema.post('deleteOne', { document: true }, async function() {
  try {
    await updateUserFollowCounts(this.followerId, this.followingId);
  } catch (error) {
    console.error('Error updating follow counts after removal:', error);
  }
});

// Helper function to update follow counts on user documents
async function updateUserFollowCounts(followerId, followingId) {
  const Follow = mongoose.model('Follow');
  const User = mongoose.model('User');
  
  // Update follower's following count
  const followingCount = await Follow.countDocuments({
    followerId,
    status: 'accepted'
  });
  
  // Update following user's followers count
  const followersCount = await Follow.countDocuments({
    followingId,
    status: 'accepted'
  });
  
  await Promise.all([
    User.findByIdAndUpdate(followerId, { followingCount }),
    User.findByIdAndUpdate(followingId, { followersCount })
  ]);
}

module.exports = mongoose.model('Follow', followSchema);
