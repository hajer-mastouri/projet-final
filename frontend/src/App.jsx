import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBooks from './pages/MyBooks';
import MyRecommendations from './pages/MyRecommendations';
import BookDetails from './pages/BookDetails';
import UserProfile from './pages/UserProfile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-books" element={<MyBooks />} />
              <Route path="/my-recommendations" element={<MyRecommendations />} />
            <Route path="/book/:bookId" element={<BookDetails />} />
            <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/recommendations" element={
                <div className="page-placeholder">
                  <h2>Book Recommendations</h2>
                  <p>Coming soon! This page will show personalized book recommendations.</p>
                </div>
              } />
              <Route path="/discover" element={
                <div className="page-placeholder">
                  <h2>Discover Books</h2>
                  <p>Coming soon! This page will help you discover new books.</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
