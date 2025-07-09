import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './ModernHeader.css';

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
      <header className="app-header">
        <nav className="nav">
          <Link to="/" className="nav-brand">
            <div className="nav-brand-icon">📚</div>
            <span>BookRecs</span>
          </Link>

          <ul className="nav-menu">
            <li>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/discover"
                className={`nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
              >
                Discover
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link
                    to="/my-recommendations"
                    className={`nav-link ${location.pathname === '/my-recommendations' ? 'active' : ''}`}
                  >
                    My Books
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feed"
                    className={`nav-link ${location.pathname === '/feed' ? 'active' : ''}`}
                  >
                    Feed
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="nav-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                <button className="user-menu-trigger">
                  <div className="user-avatar">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} />
                    ) : (
                      <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <span className="user-name">{user?.name}</span>
                  <svg className="chevron-down" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>

                <div className="user-menu-dropdown">
                  <Link to={`/user/${user?.userId}`} className="dropdown-item">
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <span className="dropdown-icon">⚙️</span>
                    Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
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
