const mongoose = require('mongoose');

const readingListSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['want-to-read', 'currently-reading', 'read'],
    default: 'want-to-read',
    index: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  startedReading: {
    type: Date
  },
  finishedReading: {
    type: Date
  },
  progress: {
    currentPage: {
      type: Number,
      min: 0,
      default: 0
    },
    totalPages: {
      type: Number,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
}, {
  timestamps: true
});

// Compound index to ensure one entry per user per book
readingListSchema.index({ userId: 1, bookId: 1 }, { unique: true });
readingListSchema.index({ userId: 1, googleBooksId: 1 }, { unique: true });

// Indexes for queries
readingListSchema.index({ userId: 1, status: 1, createdAt: -1 });
readingListSchema.index({ userId: 1, priority: -1 });
readingListSchema.index({ status: 1, isPublic: 1 });

// Virtual to populate book details
readingListSchema.virtual('book', {
  ref: 'Book',
  localField: 'bookId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user details
readingListSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for reading duration (if finished)
readingListSchema.virtual('readingDuration').get(function() {
  if (this.startedReading && this.finishedReading) {
    const duration = this.finishedReading - this.startedReading;
    return Math.ceil(duration / (1000 * 60 * 60 * 24)); // Days
  }
  return null;
});

// Virtual for reading progress percentage
readingListSchema.virtual('progressPercentage').get(function() {
  if (this.progress.totalPages && this.progress.currentPage) {
    return Math.round((this.progress.currentPage / this.progress.totalPages) * 100);
  }
  return this.progress.percentage || 0;
});

// Static method to get user's reading list
readingListSchema.statics.getUserReadingList = function(userId, options = {}) {
  const {
    status,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('book', 'title authors imageLinks averageRating totalRatings googleBooksId pageCount')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get reading statistics for a user
readingListSchema.statics.getUserReadingStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    'want-to-read': 0,
    'currently-reading': 0,
    'read': 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Static method to check if book is in user's reading list
readingListSchema.statics.isInUserList = async function(userId, googleBooksId) {
  const entry = await this.findOne({ userId, googleBooksId });
  return entry ? entry.status : null;
};

// Static method to get popular books from reading lists
readingListSchema.statics.getPopularFromLists = async function(limit = 10) {
  const popular = await this.aggregate([
    { $match: { isPublic: true } },
    {
      $group: {
        _id: '$bookId',
        count: { $sum: 1 },
        googleBooksId: { $first: '$googleBooksId' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'book'
      }
    },
    { $unwind: '$book' },
    {
      $project: {
        book: 1,
        count: 1
      }
    }
  ]);
  
  return popular.map(item => ({
    ...item.book,
    addedToListCount: item.count
  }));
};

// Instance method to update reading progress
readingListSchema.methods.updateProgress = async function(currentPage, totalPages) {
  if (totalPages) {
    this.progress.totalPages = totalPages;
  }
  
  if (currentPage !== undefined) {
    this.progress.currentPage = currentPage;
    
    if (this.progress.totalPages) {
      this.progress.percentage = Math.round((currentPage / this.progress.totalPages) * 100);
      
      // Auto-update status based on progress
      if (this.progress.percentage === 0 && this.status === 'currently-reading') {
        this.status = 'want-to-read';
      } else if (this.progress.percentage > 0 && this.progress.percentage < 100 && this.status === 'want-to-read') {
        this.status = 'currently-reading';
        if (!this.startedReading) {
          this.startedReading = new Date();
        }
      } else if (this.progress.percentage === 100 && this.status !== 'read') {
        this.status = 'read';
        this.finishedReading = new Date();
      }
    }
  }
  
  await this.save();
  return this;
};

// Instance method to mark as started reading
readingListSchema.methods.startReading = async function() {
  this.status = 'currently-reading';
  this.startedReading = new Date();
  await this.save();
  return this;
};

// Instance method to mark as finished reading
readingListSchema.methods.finishReading = async function() {
  this.status = 'read';
  this.finishedReading = new Date();
  this.progress.percentage = 100;
  if (this.progress.totalPages) {
    this.progress.currentPage = this.progress.totalPages;
  }
  await this.save();
  return this;
};

// Pre-save middleware to update book's addedToListCount
readingListSchema.post('save', async function() {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.bookId);
    if (book) {
      const count = await this.constructor.countDocuments({ bookId: this.bookId });
      book.addedToListCount = count;
      await book.save();
    }
  } catch (error) {
    console.error('Error updating book addedToListCount:', error);
  }
});

// Post-remove middleware to update book's addedToListCount
readingListSchema.post('remove', async function() {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.bookId);
    if (book) {
      const count = await this.constructor.countDocuments({ bookId: this.bookId });
      book.addedToListCount = count;
      await book.save();
    }
  } catch (error) {
    console.error('Error updating book addedToListCount after removal:', error);
  }
});

// Pre-save middleware for validation
readingListSchema.pre('save', function(next) {
  // Validate progress percentage
  if (this.progress.percentage < 0) this.progress.percentage = 0;
  if (this.progress.percentage > 100) this.progress.percentage = 100;
  
  // Validate current page
  if (this.progress.currentPage < 0) this.progress.currentPage = 0;
  if (this.progress.totalPages && this.progress.currentPage > this.progress.totalPages) {
    this.progress.currentPage = this.progress.totalPages;
  }
  
  // Ensure dates are logical
  if (this.startedReading && this.finishedReading && this.startedReading > this.finishedReading) {
    return next(new Error('Start date cannot be after finish date'));
  }
  
  next();
});

module.exports = mongoose.model('ReadingList', readingListSchema);
