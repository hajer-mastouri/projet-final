import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ModernHome.css';

const ModernHome = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          {isAuthenticated ? (
            <>
              <h1 className="hero-title">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="hero-subtitle">
                Ready to discover your next favorite book or share a recommendation with the community?
              </p>
              <div className="hero-cta">
                <Link to="/my-recommendations" className="hero-btn hero-btn-primary">
                  📚 My Library
                </Link>
                <Link to="/discover" className="hero-btn hero-btn-secondary">
                  🔍 Discover Books
                </Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-number">12</span>
                  <span className="hero-stat-label">Books Read</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">8</span>
                  <span className="hero-stat-label">Recommendations</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">24</span>
                  <span className="hero-stat-label">Following</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-title">
                Discover Your Next Great Read
              </h1>
              <p className="hero-subtitle">
                Join our vibrant community of book lovers! Share recommendations, discover new favorites, 
                and connect with fellow readers who share your passion for great stories.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="hero-btn hero-btn-primary">
                  ✨ Get Started Free
                </Link>
                <Link to="/login" className="hero-btn hero-btn-secondary">
                  🔑 Sign In
                </Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-number">10K+</span>
                  <span className="hero-stat-label">Books</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">5K+</span>
                  <span className="hero-stat-label">Readers</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">25K+</span>
                  <span className="hero-stat-label">Reviews</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Why Choose BookRecs?</h2>
            <p className="features-subtitle">
              Discover, share, and track your reading journey with our comprehensive book recommendation platform designed for passionate readers.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Smart Discovery</h3>
              <p className="feature-description">
                Find your next favorite book with our intelligent recommendation system that learns from your preferences and reading history.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Community Driven</h3>
              <p className="feature-description">
                Connect with fellow book lovers, share recommendations, and discover what others in your reading community are enjoying.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Track Your Journey</h3>
              <p className="feature-description">
                Keep track of books you've read, want to read, and your personal ratings to build your unique reading profile.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3 className="feature-title">Rate & Review</h3>
              <p className="feature-description">
                Share your thoughts with detailed reviews and ratings to help others discover their next great read.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Personalized</h3>
              <p className="feature-description">
                Get recommendations tailored specifically to your taste, reading habits, and favorite genres.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Always Accessible</h3>
              <p className="feature-description">
                Access your reading list and recommendations anywhere, anytime with our responsive design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to Start Your Reading Journey?</h2>
            <p className="cta-description">
              Join thousands of readers who have already discovered their next favorite books through our platform.
            </p>
            <Link to="/register" className="cta-button">
              Join the Community Today 🚀
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernHome;
