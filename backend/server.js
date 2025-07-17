const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration for Production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        'https://bookrecs.vercel.app',
        'https://bookrecs-frontend.vercel.app'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mernapp');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'BookRecs API Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'BookRecs API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Try to use route files, fallback to inline routes
try {
  app.use('/api/auth', require('./routes/users'));
} catch (error) {
  console.log('Auth routes file not found, using fallback routes');

  // Fallback authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log('Registration request:', req.body);
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      const mockUser = {
        userId: Date.now().toString(),
        name,
        email,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login request:', req.body);
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const mockUser = {
        userId: Date.now().toString(),
        name: 'Test User',
        email,
        createdAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Login successful',
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  });

  app.get('/api/auth/profile', (req, res) => {
    res.json({
      success: true,
      user: {
        userId: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString()
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⚠️  No MongoDB URI provided, running without database');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit in production, continue without database
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${JSON.stringify(corsOptions.origin)}`);

    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Production mode enabled');
    } else {
      console.log('🔧 Development mode - Test with: curl http://localhost:' + PORT + '/api/test');
    }
  });
};

startServer().catch(console.error);
