const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  googleBooksId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 500
  },
  authors: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  description: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: 200
  },
  publishedDate: {
    type: String,
    trim: true
  },
  pageCount: {
    type: Number,
    min: 0
  },
  categories: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  language: {
    type: String,
    trim: true,
    maxlength: 10
  },
  imageLinks: {
    smallThumbnail: String,
    thumbnail: String,
    small: String,
    medium: String,
    large: String,
    extraLarge: String
  },
  industryIdentifiers: [{
    type: {
      type: String,
      enum: ['ISBN_10', 'ISBN_13', 'ISSN', 'OTHER']
    },
    identifier: String
  }],
  previewLink: String,
  infoLink: String,
  
  // Our additional fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  addedToListCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
bookSchema.index({ title: 'text', authors: 'text', description: 'text' });
bookSchema.index({ averageRating: -1 });
bookSchema.index({ totalRatings: -1 });
bookSchema.index({ viewCount: -1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ categories: 1 });

// Virtual for formatted authors
bookSchema.virtual('authorsString').get(function() {
  return this.authors.join(', ');
});

// Method to update rating statistics
bookSchema.methods.updateRatingStats = async function() {
  const Rating = mongoose.model('Rating');
  
  const stats = await Rating.aggregate([
    { $match: { bookId: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
    this.totalRatings = stats[0].totalRatings;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  
  await this.save();
  return this;
};

// Method to increment view count
bookSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

// Static method to find or create book from Google Books data
bookSchema.statics.findOrCreateFromGoogleBooks = async function(googleBooksData) {
  const volumeInfo = googleBooksData.volumeInfo || {};
  
  let book = await this.findOne({ googleBooksId: googleBooksData.id });
  
  if (!book) {
    book = new this({
      googleBooksId: googleBooksData.id,
      title: volumeInfo.title || 'Unknown Title',
      subtitle: volumeInfo.subtitle,
      authors: volumeInfo.authors || [],
      description: volumeInfo.description,
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories || [],
      language: volumeInfo.language,
      imageLinks: volumeInfo.imageLinks || {},
      industryIdentifiers: volumeInfo.industryIdentifiers || [],
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink
    });
    
    await book.save();
  }
  
  return book;
};

// Static method to get popular books
bookSchema.statics.getPopular = function(limit = 10) {
  return this.find()
    .sort({ averageRating: -1, totalRatings: -1 })
    .limit(limit)
    .select('title authors imageLinks averageRating totalRatings googleBooksId');
};

// Static method to get recently rated books
bookSchema.statics.getRecentlyRated = function(limit = 10) {
  return this.find({ totalRatings: { $gt: 0 } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('title authors imageLinks averageRating totalRatings googleBooksId');
};

// Pre-save middleware to ensure data consistency
bookSchema.pre('save', function(next) {
  // Ensure averageRating is within bounds
  if (this.averageRating < 0) this.averageRating = 0;
  if (this.averageRating > 5) this.averageRating = 5;
  
  // Ensure counts are non-negative
  if (this.totalRatings < 0) this.totalRatings = 0;
  if (this.totalReviews < 0) this.totalReviews = 0;
  if (this.viewCount < 0) this.viewCount = 0;
  if (this.addedToListCount < 0) this.addedToListCount = 0;
  
  next();
});

module.exports = mongoose.model('Book', bookSchema);
