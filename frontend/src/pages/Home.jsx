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

      <style jsx>{`
        .home-page {
          width: 100%;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 5rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          width: 100%;
          margin: 0;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="books" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><text x="10" y="15" text-anchor="middle" fill="rgba(255,255,255,0.1)" font-size="12">📚</text></pattern></defs><rect width="100" height="100" fill="url(%23books)"/></svg>');
          opacity: 0.3;
        }

        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          letter-spacing: -1px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .hero-content p {
          font-size: 1.3rem;
          margin-bottom: 2.5rem;
          opacity: 0.95;
          line-height: 1.6;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-actions {
          margin-top: 2rem;
        }

        .cta-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 1.2rem 2.5rem;
          font-size: 1.2rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .cta-button:hover::before {
          left: 100%;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .cta-button.secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .cta-button.secondary:hover {
          background: white;
          color: #667eea;
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
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
          padding: 5rem 2rem;
          background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
          width: 100%;
          margin: 0;
        }

        .features-container {
          max-width: 1300px;
          margin: 0 auto;
          text-align: center;
        }

        .features-container h2 {
          font-size: 2.8rem;
          color: #1f2937;
          margin-bottom: 1rem;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .features-container > p {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
          margin-top: 3rem;
        }

        .feature-card {
          background: white;
          padding: 2.5rem;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
        }

        .feature-icon {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          display: block;
        }

        .feature-card h3 {
          font-size: 1.4rem;
          color: #1f2937;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.7;
          font-size: 1rem;
        }

        .cta-section {
          padding: 5rem 2rem;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
          width: 100%;
          margin: 0;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 70% 50%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
        }

        .cta-content {
          max-width: 700px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .cta-content p {
          font-size: 1.2rem;
          margin-bottom: 2.5rem;
          opacity: 0.95;
          line-height: 1.6;
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
