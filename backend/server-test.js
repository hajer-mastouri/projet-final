const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MERN Stack Backend API',
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test route working', 
    cors: 'enabled',
    origin: req.headers.origin
  });
});

// Simple auth routes
app.post('/api/auth/register', (req, res) => {
  console.log('Register request:', req.body);
  res.json({
    success: true,
    message: 'Registration successful (test mode)',
    user: {
      id: '123',
      name: req.body.name || 'Test User',
      email: req.body.email || 'test@example.com'
    },
    token: 'test-jwt-token-123'
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({
    success: true,
    message: 'Login successful (test mode)',
    user: {
      id: '123',
      name: 'Test User',
      email: req.body.email || 'test@example.com'
    },
    token: 'test-jwt-token-123'
  });
});

// Profile endpoint
app.get('/api/auth/profile', (req, res) => {
  console.log('Profile request - Headers:', req.headers.authorization);
  res.json({
    success: true,
    user: {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      favoriteGenres: ['Fiction', 'Sci-Fi'],
      readBooks: []
    }
  });
});

// Recommendations endpoints
app.get('/api/recommendations/my', (req, res) => {
  console.log('My recommendations request - Query:', req.query);
  res.json({
    success: true,
    recommendations: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false
    }
  });
});

app.post('/api/recommendations', (req, res) => {
  console.log('Create recommendation request:', req.body);
  res.json({
    success: true,
    message: 'Recommendation created successfully (test mode)',
    recommendation: {
      _id: 'test-rec-123',
      ...req.body,
      userId: '123',
      createdAt: new Date().toISOString()
    }
  });
});

app.put('/api/recommendations/:id', (req, res) => {
  console.log('Update recommendation request:', req.params.id, req.body);
  res.json({
    success: true,
    message: 'Recommendation updated successfully (test mode)',
    recommendation: {
      _id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    }
  });
});

app.delete('/api/recommendations/:id', (req, res) => {
  console.log('Delete recommendation request:', req.params.id);
  res.json({
    success: true,
    message: 'Recommendation deleted successfully (test mode)'
  });
});

// Book endpoints for testing
app.get('/api/books/:googleBooksId', (req, res) => {
  console.log('Get book details request:', req.params.googleBooksId);
  res.json({
    success: true,
    book: {
      _id: 'test-book-id',
      googleBooksId: req.params.googleBooksId,
      title: 'Test Book Title',
      authors: ['Test Author'],
      description: 'This is a test book description for development purposes.',
      imageLinks: {
        thumbnail: 'https://via.placeholder.com/128x192?text=Book+Cover'
      },
      averageRating: 4.2,
      totalRatings: 15,
      totalReviews: 8,
      viewCount: 42,
      reviews: []
    }
  });
});

app.get('/api/books/:googleBooksId/rating', (req, res) => {
  console.log('Get user rating request:', req.params.googleBooksId);
  res.json({
    success: true,
    rating: 0 // No rating by default
  });
});

app.post('/api/books/:googleBooksId/rating', (req, res) => {
  console.log('Rate book request:', req.params.googleBooksId, req.body);
  res.json({
    success: true,
    message: 'Rating saved successfully (test mode)',
    rating: req.body.rating,
    averageRating: 4.3,
    totalRatings: 16
  });
});

app.get('/api/books/:googleBooksId/reading-list', (req, res) => {
  console.log('Check reading list request:', req.params.googleBooksId);
  res.json({
    success: true,
    inList: false,
    status: null
  });
});

app.post('/api/books/:googleBooksId/reading-list', (req, res) => {
  console.log('Add to reading list request:', req.params.googleBooksId, req.body);
  res.json({
    success: true,
    message: 'Book added to reading list (test mode)',
    entry: {
      _id: 'test-entry-id',
      status: 'want-to-read'
    }
  });
});

app.delete('/api/books/:googleBooksId/reading-list', (req, res) => {
  console.log('Remove from reading list request:', req.params.googleBooksId);
  res.json({
    success: true,
    message: 'Book removed from reading list (test mode)'
  });
});

app.get('/api/books/:googleBooksId/reviews', (req, res) => {
  console.log('Get reviews request:', req.params.googleBooksId, req.query);
  res.json({
    success: true,
    reviews: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false
    }
  });
});

app.post('/api/books/:googleBooksId/reviews', (req, res) => {
  console.log('Add review request:', req.params.googleBooksId, req.body);
  res.json({
    success: true,
    message: 'Review added successfully (test mode)',
    review: {
      _id: 'test-review-id',
      text: req.body.text,
      userName: 'Test User',
      createdAt: new Date().toISOString()
    }
  });
});

app.post('/api/auth/test', (req, res) => {
  res.json({
    message: 'Auth endpoint working',
    body: req.body,
    cors: 'enabled'
  });
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:5173, http://localhost:5174`);
  console.log(`Test with: curl http://localhost:${PORT}/test`);
});
