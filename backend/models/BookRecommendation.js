const mongoose = require('mongoose');

const bookRecommendationSchema = new mongoose.Schema({
  // Basic book information
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Book description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true,
    enum: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
      'Fantasy', 'Thriller', 'Biography', 'History', 'Self-Help',
      'Business', 'Technology', 'Health', 'Travel', 'Cooking',
      'Art', 'Poetry', 'Drama', 'Horror', 'Adventure'
    ]
  },
  
  // User's rating and recommendation
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  recommendationReason: {
    type: String,
    required: [true, 'Recommendation reason is required'],
    trim: true,
    minlength: [20, 'Recommendation reason must be at least 20 characters'],
    maxlength: [1000, 'Recommendation reason cannot exceed 1000 characters']
  },
  
  // Optional book details
  isbn: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Basic ISBN validation (10 or 13 digits, may contain hyphens)
        return /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/.test(v);
      },
      message: 'Please enter a valid ISBN'
    }
  },
  
  publishedYear: {
    type: Number,
    min: [1000, 'Published year must be after 1000'],
    max: [new Date().getFullYear(), 'Published year cannot be in the future']
  },
  
  pageCount: {
    type: Number,
    min: [1, 'Page count must be at least 1']
  },
  
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  
  coverUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Basic URL validation
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Please enter a valid image URL'
    }
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Personal notes
  personalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Personal notes cannot exceed 1000 characters']
  },
  
  // User who created the recommendation
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Engagement metrics
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  viewCount: {
    type: Number,
    default: 0
  },
  
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookRecommendationSchema.index({ userId: 1, createdAt: -1 });
bookRecommendationSchema.index({ genre: 1, rating: -1 });
bookRecommendationSchema.index({ title: 'text', author: 'text', description: 'text' });
bookRecommendationSchema.index({ tags: 1 });
bookRecommendationSchema.index({ featured: 1, createdAt: -1 });

// Virtual for like count
bookRecommendationSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
bookRecommendationSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Instance method to check if user liked the recommendation
bookRecommendationSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.userId.toString() === userId.toString());
};

// Instance method to add a like
bookRecommendationSchema.methods.addLike = function(userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ userId });
  }
  return this.save();
};

// Instance method to remove a like
bookRecommendationSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.userId.toString() !== userId.toString());
  return this.save();
};

// Instance method to add a comment
bookRecommendationSchema.methods.addComment = function(userId, comment) {
  this.comments.push({ userId, comment });
  return this.save();
};

// Static method to get recommendations by genre
bookRecommendationSchema.statics.getByGenre = function(genre, limit = 10) {
  return this.find({ genre, status: 'published', isPublic: true })
    .populate('userId', 'username email')
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get featured recommendations
bookRecommendationSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ featured: true, status: 'published', isPublic: true })
    .populate('userId', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to search recommendations
bookRecommendationSchema.statics.searchRecommendations = function(query, options = {}) {
  const {
    genre,
    minRating = 1,
    maxRating = 5,
    tags,
    userId,
    limit = 20,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const searchQuery = {
    status: 'published',
    isPublic: true,
    rating: { $gte: minRating, $lte: maxRating }
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (genre) {
    searchQuery.genre = genre;
  }

  if (tags && tags.length > 0) {
    searchQuery.tags = { $in: tags };
  }

  if (userId) {
    searchQuery.userId = userId;
  }

  return this.find(searchQuery)
    .populate('userId', 'username email')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware to update tags
bookRecommendationSchema.pre('save', function(next) {
  // Remove empty tags and duplicates
  if (this.tags) {
    this.tags = [...new Set(this.tags.filter(tag => tag && tag.trim()))];
  }
  next();
});

// Pre-remove middleware to clean up related data
bookRecommendationSchema.pre('remove', function(next) {
  // Here you could add cleanup logic for related data
  // For example, removing from user's favorites, etc.
  next();
});

module.exports = mongoose.model('BookRecommendation', bookRecommendationSchema);
