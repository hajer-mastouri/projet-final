import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Discover Your Next Great Read</h1>
            <p>
              Get personalized book recommendations based on your reading preferences
              and discover amazing books tailored just for you.
            </p>
            {!isAuthenticated ? (
              <div className="hero-actions">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="cta-button"
                >
                  Get Started
                </button>
                <p className="cta-subtitle">Join thousands of book lovers</p>
              </div>
            ) : (
              <div className="welcome-back">
                <h2>Welcome back, {user?.name}! 📚</h2>
                <p>Ready to discover your next favorite book?</p>
              </div>
            )}
          </div>
        </section>

        <section className="features-section">
          <div className="features-container">
            <h2>Why Choose BookRecommend?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Personalized Recommendations</h3>
                <p>Get book suggestions tailored to your unique reading preferences and favorite genres.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📚</div>
                <h3>Track Your Reading</h3>
                <p>Keep track of books you've read, rate them, and build your personal reading history.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Discover New Authors</h3>
                <p>Explore books from new authors and genres you might not have considered before.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Start Your Reading Journey?</h2>
            <p>Join our community of book lovers and never run out of great books to read.</p>
            {!isAuthenticated && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="cta-button secondary"
              >
                Sign Up Now
              </button>
            )}
          </div>
        </section>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
      />

      <style jsx>{`
        .home-page {
          min-height: 100vh;
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 2rem;
          text-align: center;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-content h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .hero-content p {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.6;
        }

        .hero-actions {
          margin-top: 2rem;
        }

        .cta-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .cta-button.secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .cta-button.secondary:hover {
          background: white;
          color: #667eea;
        }

        .cta-subtitle {
          margin-top: 1rem;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .welcome-back {
          margin-top: 2rem;
        }

        .welcome-back h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .features-section {
          padding: 4rem 2rem;
          background: #f9fafb;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .features-container h2 {
          font-size: 2.5rem;
          color: #1f2937;
          margin-bottom: 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        .cta-section {
          padding: 4rem 2rem;
          background: #1f2937;
          color: white;
          text-align: center;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-content h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .cta-content p {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 2rem;
          }

          .hero-content p {
            font-size: 1rem;
          }

          .features-container h2 {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .cta-content h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default Home;
