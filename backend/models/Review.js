const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  googleBooksId: {
    type: String,
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Review must be at least 10 characters long'],
    maxlength: [2000, 'Review cannot exceed 2000 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
reviewSchema.index({ bookId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ googleBooksId: 1, createdAt: -1 });
reviewSchema.index({ isPublic: 1, isModerated: 1 });
reviewSchema.index({ helpfulCount: -1 });

// Compound index to prevent duplicate reviews from same user for same book
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });
reviewSchema.index({ userId: 1, googleBooksId: 1 }, { unique: true });

// Virtual to populate user details
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate book details
reviewSchema.virtual('book', {
  ref: 'Book',
  localField: 'bookId',
  foreignField: '_id',
  justOne: true
});

// Virtual for review excerpt (first 150 characters)
reviewSchema.virtual('excerpt').get(function() {
  if (this.text.length <= 150) {
    return this.text;
  }
  return this.text.substring(0, 147) + '...';
});

// Static method to get reviews for a book
reviewSchema.statics.getBookReviews = function(googleBooksId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({
    googleBooksId,
    isPublic: true,
    isModerated: false
  })
    .populate('user', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get user's reviews
reviewSchema.statics.getUserReviews = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find({ userId })
    .populate('book', 'title authors imageLinks googleBooksId')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get review statistics for a book
reviewSchema.statics.getBookReviewStats = async function(googleBooksId) {
  const stats = await this.aggregate([
    {
      $match: {
        googleBooksId,
        isPublic: true,
        isModerated: false
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageHelpfulCount: { $avg: '$helpfulCount' }
      }
    }
  ]);
  
  return stats.length > 0 ? {
    totalReviews: stats[0].totalReviews,
    averageHelpfulCount: Math.round(stats[0].averageHelpfulCount * 10) / 10
  } : {
    totalReviews: 0,
    averageHelpfulCount: 0
  };
};

// Static method to check if user has reviewed a book
reviewSchema.statics.hasUserReviewed = async function(userId, googleBooksId) {
  const review = await this.findOne({ userId, googleBooksId });
  return !!review;
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = async function() {
  this.helpfulCount += 1;
  await this.save();
  return this;
};

// Instance method to report review
reviewSchema.methods.report = async function(reason) {
  this.reportCount += 1;
  if (this.reportCount >= 5) { // Auto-moderate after 5 reports
    this.isModerated = true;
    this.moderationReason = 'Auto-moderated due to multiple reports';
  }
  await this.save();
  return this;
};

// Post-save middleware to update book review count
reviewSchema.post('save', async function() {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.bookId);
    if (book) {
      const reviewCount = await this.constructor.countDocuments({
        bookId: this.bookId,
        isPublic: true,
        isModerated: false
      });
      book.totalReviews = reviewCount;
      await book.save();
    }
  } catch (error) {
    console.error('Error updating book review count:', error);
  }
});

// Post-remove middleware to update book review count
reviewSchema.post('remove', async function() {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.bookId);
    if (book) {
      const reviewCount = await this.constructor.countDocuments({
        bookId: this.bookId,
        isPublic: true,
        isModerated: false
      });
      book.totalReviews = reviewCount;
      await book.save();
    }
  } catch (error) {
    console.error('Error updating book review count after removal:', error);
  }
});

// Pre-save middleware for validation and sanitization
reviewSchema.pre('save', function(next) {
  // Trim and clean the review text
  this.text = this.text.trim();
  
  // Basic profanity filter (you can enhance this)
  const profanityWords = ['spam', 'fake', 'scam']; // Add more as needed
  const lowerText = this.text.toLowerCase();
  
  for (const word of profanityWords) {
    if (lowerText.includes(word)) {
      this.isModerated = true;
      this.moderationReason = 'Contains inappropriate content';
      break;
    }
  }
  
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
