import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  if (isAuthenticated) {
    return children;
  }

  // If fallback is provided, render it
  if (fallback) {
    return fallback;
  }

  // Otherwise, show authentication required message
  return (
    <>
      <div className="auth-required">
        <div className="auth-required-content">
          <h2>Authentication Required</h2>
          <p>Please sign in to access this feature.</p>
          <div className="auth-required-buttons">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="auth-btn primary"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />




    </>
  );
};

export default ProtectedRoute;
