import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import MyBooks from './pages/MyBooks';
import MyRecommendations from './pages/MyRecommendations';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/my-books" element={<MyBooks />} />
              <Route path="/my-recommendations" element={<MyRecommendations />} />
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
