import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

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

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .auth-required {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          padding: 2rem;
        }

        .auth-required-content {
          text-align: center;
          max-width: 400px;
        }

        .auth-required-content h2 {
          color: #1f2937;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .auth-required-content p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .auth-required-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .auth-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .auth-btn.primary {
          background-color: #3b82f6;
          color: white;
        }

        .auth-btn.primary:hover {
          background-color: #2563eb;
        }
      `}</style>
    </>
  );
};

export default ProtectedRoute;
