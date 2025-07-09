import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import BookRecommendationForm from '../components/BookRecommendationForm';
import BookSearch from '../components/BookSearch';
import recommendationApiService from '../services/recommendationApi';
import './MyBooks.css';

const MyRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit', 'search'
  const [editingRecommendation, setEditingRecommendation] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load user's recommendations
  const loadRecommendations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationApiService.getMyRecommendations({
        page,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecommendations(data.recommendations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  // Handle form submission for new recommendation
  const handleAddRecommendation = async (recommendationData) => {
    try {
      setError(null);
      const result = await recommendationApiService.createRecommendation(recommendationData);
      setCurrentView('list');
      loadRecommendations(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Handle form submission for editing recommendation
  const handleEditRecommendation = async (recommendationData) => {
    try {
      setError(null);
      const result = await recommendationApiService.updateRecommendation(
        editingRecommendation._id,
        recommendationData
      );
      setCurrentView('list');
      setEditingRecommendation(null);
      loadRecommendations(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Handle recommendation deletion
  const handleDeleteRecommendation = async (id) => {
    if (window.confirm('Are you sure you want to delete this recommendation?')) {
      try {
        setError(null);
        await recommendationApiService.deleteRecommendation(id);
        loadRecommendations(); // Refresh the list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Handle edit button click
  const handleEditClick = (recommendation) => {
    setEditingRecommendation(recommendation);
    setCurrentView('edit');
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setCurrentView('list');
    setEditingRecommendation(null);
    setError(null);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    loadRecommendations(newPage);
  };

  // Render different views based on currentView state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'add':
        return (
          <BookRecommendationForm
            onSubmit={handleAddRecommendation}
            onCancel={handleCancelForm}
          />
        );
      
      case 'edit':
        return (
          <BookRecommendationForm
            initialData={editingRecommendation}
            onSubmit={handleEditRecommendation}
            onCancel={handleCancelForm}
          />
        );
      
      case 'search':
        return (
          <div>
            <div className="view-header">
              <h2>Search Books</h2>
              <button 
                onClick={() => setCurrentView('list')}
                className="back-button"
              >
                ← Back to My Recommendations
              </button>
            </div>
            <BookSearch />
          </div>
        );
      
      default:
        return renderRecommendationsList();
    }
  };

  // Render recommendations list
  const renderRecommendationsList = () => (
    <div className="my-books-page">
      <div className="page-header">
        <h1>My Book Recommendations</h1>
        <div className="header-actions">
          <button 
            onClick={() => setCurrentView('search')}
            className="search-button"
          >
            🔍 Search Books
          </button>
          <button 
            onClick={() => setCurrentView('add')}
            className="add-book-btn"
          >
            + Add Recommendation
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your recommendations...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="empty-state">
          <h3>No recommendations yet!</h3>
          <p>Start sharing your favorite books with others by adding your first recommendation.</p>
          <button 
            onClick={() => setCurrentView('add')}
            className="add-first-book-btn"
          >
            Add Your First Recommendation
          </button>
        </div>
      ) : (
        <>
          <div className="recommendations-stats">
            <p>You have {pagination.totalItems} recommendation{pagination.totalItems !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="books-grid">
            {recommendations.map((recommendation) => (
              <div key={recommendation._id} className="book-card">
                {recommendation.coverUrl && (
                  <div className="book-cover">
                    <img src={recommendation.coverUrl} alt={recommendation.title} />
                  </div>
                )}
                
                <div className="book-info">
                  <h3>{recommendation.title}</h3>
                  <p className="author">by {recommendation.author}</p>
                  <p className="genre">{recommendation.genre}</p>
                  
                  <div className="rating">
                    <span className="stars">
                      {'★'.repeat(recommendation.rating)}{'☆'.repeat(5-recommendation.rating)}
                    </span>
                    <span className="rating-text">({recommendation.rating}/5)</span>
                  </div>
                  
                  <p className="description">
                    {recommendation.description.length > 100 
                      ? `${recommendation.description.substring(0, 100)}...` 
                      : recommendation.description}
                  </p>
                  
                  <div className="recommendation-stats">
                    <span>👍 {recommendation.likeCount || 0}</span>
                    <span>💬 {recommendation.commentCount || 0}</span>
                    <span>👁 {recommendation.viewCount || 0}</span>
                  </div>
                  
                  <div className="book-actions">
                    <button 
                      onClick={() => handleEditClick(recommendation)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteRecommendation(recommendation._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="page-btn"
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const MyRecommendationsContent = () => renderCurrentView();

  return (
    <ProtectedRoute>
      <MyRecommendationsContent />
    </ProtectedRoute>
  );
};

export default MyRecommendations;
