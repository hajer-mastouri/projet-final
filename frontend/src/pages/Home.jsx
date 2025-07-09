import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import './Home.css';

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
            <p>Discover the perfect reading experience tailored just for you</p>
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





    </>
  );
};

export default Home;
