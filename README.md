# MERN Stack Application

A full-stack web application built with MongoDB, Express.js, React, and Node.js.

## Project Structure

```
projet final/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database and other configurations
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── server.js          # Main server file
│   ├── .env               # Environment variables
│   └── package.json       # Backend dependencies
│
└── frontend/              # React frontend
    ├── src/
    │   ├── components/    # Reusable React components
    │   ├── pages/         # Page components
    │   ├── services/      # API service functions
    │   ├── context/       # React context providers
    │   ├── hooks/         # Custom React hooks
    │   └── utils/         # Utility functions
    ├── public/            # Static assets
    └── package.json       # Frontend dependencies
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and configure your environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mernapp
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **nodemon** - Development server auto-restart

### Frontend
- **React** - UI library
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## API Endpoints

The backend API will be available at `http://localhost:5000/api`

### Example endpoints (to be implemented):
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the ISC License.
