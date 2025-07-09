const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1 && v <= 5;
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per book
ratingSchema.index({ userId: 1, bookId: 1 }, { unique: true });
ratingSchema.index({ userId: 1, googleBooksId: 1 }, { unique: true });

// Index for queries
ratingSchema.index({ bookId: 1, rating: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });
ratingSchema.index({ createdAt: -1 });

// Virtual to populate book details
ratingSchema.virtual('book', {
  ref: 'Book',
  localField: 'bookId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user details
ratingSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static method to get user's rating for a book
ratingSchema.statics.getUserRating = async function(userId, googleBooksId) {
  const rating = await this.findOne({ userId, googleBooksId });
  return rating ? rating.rating : 0;
};

// Static method to get average rating for a book
ratingSchema.statics.getBookAverageRating = async function(googleBooksId) {
  const result = await this.aggregate([
    { $match: { googleBooksId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalRatings: result[0].totalRatings
  } : {
    averageRating: 0,
    totalRatings: 0
  };
};

// Static method to get user's recent ratings
ratingSchema.statics.getUserRecentRatings = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('book', 'title authors imageLinks googleBooksId');
};

// Static method to get rating distribution for a book
ratingSchema.statics.getRatingDistribution = async function(googleBooksId) {
  const distribution = await this.aggregate([
    { $match: { googleBooksId } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  
  // Initialize all ratings to 0
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  // Fill in actual counts
  distribution.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
};

// Post-save middleware to update book rating statistics
ratingSchema.post('save', async function() {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.bookId);
    if (book) {
      await book.updateRatingStats();
    }
  } catch (error) {
    console.error('Error updating book rating stats:', error);
  }
});

// Post-remove middleware to update book rating statistics
ratingSchema.post('remove', async function() {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.bookId);
    if (book) {
      await book.updateRatingStats();
    }
  } catch (error) {
    console.error('Error updating book rating stats after removal:', error);
  }
});

// Pre-save middleware for validation
ratingSchema.pre('save', function(next) {
  // Ensure rating is within valid range
  if (this.rating < 1 || this.rating > 5) {
    return next(new Error('Rating must be between 1 and 5'));
  }
  
  // Ensure rating is an integer
  if (!Number.isInteger(this.rating)) {
    return next(new Error('Rating must be an integer'));
  }
  
  next();
});

module.exports = mongoose.model('Rating', ratingSchema);
