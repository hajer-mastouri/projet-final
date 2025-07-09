import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const location = useLocation();

  const handleLoginClick = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <h1 className="logo">📚 BookRecommend</h1>
          </div>

          <nav className="header-nav">
            <Link
              to="/discover"
              className={`nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
            >
              Discover
            </Link>
            <Link
              to="/my-books"
              className={`nav-link ${location.pathname === '/my-books' ? 'active' : ''}`}
            >
              My Books
            </Link>
            <Link
              to="/recommendations"
              className={`nav-link ${location.pathname === '/recommendations' ? 'active' : ''}`}
            >
              Recommendations
            </Link>
          </nav>

          <div className="header-right">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="welcome-text">Welcome, {user?.name}!</span>
                <button
                  onClick={handleLogout}
                  className="auth-btn logout-btn"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button
                  onClick={handleLoginClick}
                  className="auth-btn login-btn"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="auth-btn register-btn"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;
