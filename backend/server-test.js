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
