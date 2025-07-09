const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  favoriteGenres: [{
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Other']
  }],
  readBooks: [{
    title: String,
    author: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    dateRead: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    receiveRecommendations: {
      type: Boolean,
      default: true
    },
    preferredLanguage: {
      type: String,
      default: 'English'
    }
  },
  // Social features
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profilePicture: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot exceed 200 characters']
  },
  // Social counts (updated by middleware)
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  recommendationsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reviewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likesReceivedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  showEmail: {
    type: Boolean,
    default: false
  },
  showReadingList: {
    type: Boolean,
    default: true
  },
  // Notification preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  followNotifications: {
    type: Boolean,
    default: true
  },
  likeNotifications: {
    type: Boolean,
    default: true
  },
  commentNotifications: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
