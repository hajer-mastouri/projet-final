import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import BookRecommendationForm from '../components/BookRecommendationForm';
import bookApiService from '../services/bookApi';
import bookDetailsService from '../services/bookDetailsApi';
import './BookDetails.css';

const BookDetails = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [showRecommendForm, setShowRecommendForm] = useState(false);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');

  useEffect(() => {
    loadBookDetails();
    if (isAuthenticated) {
      loadUserRating();
      checkReadingList();
    }
  }, [bookId, isAuthenticated]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from our database first
      let bookData = await bookDetailsService.getBookDetails(bookId);
      
      // If not in our database, fetch from Google Books API
      if (!bookData) {
        const googleBookData = await bookApiService.getBookById(bookId);
        if (googleBookData) {
          // Save to our database for future reference
          bookData = await bookDetailsService.saveBookDetails(googleBookData);
        }
      }
      
      if (bookData) {
        setBook(bookData);
        setAverageRating(bookData.averageRating || 0);
        setTotalRatings(bookData.totalRatings || 0);
        setReviews(bookData.reviews || []);
      } else {
        setError('Book not found');
      }
    } catch (err) {
      setError('Failed to load book details');
      console.error('Load book details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRating = async () => {
    try {
      const rating = await bookDetailsService.getUserRating(bookId);
      setUserRating(rating || 0);
    } catch (err) {
      console.error('Load user rating error:', err);
    }
  };

  const checkReadingList = async () => {
    try {
      const inList = await bookDetailsService.isInReadingList(bookId);
      setIsInReadingList(inList);
    } catch (err) {
      console.error('Check reading list error:', err);
    }
  };

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      alert('Please log in to rate books');
      return;
    }

    try {
      const result = await bookDetailsService.rateBook(bookId, rating);
      setUserRating(rating);
      setAverageRating(result.averageRating);
      setTotalRatings(result.totalRatings);
    } catch (err) {
      console.error('Rating error:', err);
      alert('Failed to save rating');
    }
  };

  const handleAddToReadingList = async () => {
    if (!isAuthenticated) {
      alert('Please log in to add books to your reading list');
      return;
    }

    try {
      if (isInReadingList) {
        await bookDetailsService.removeFromReadingList(bookId);
        setIsInReadingList(false);
      } else {
        await bookDetailsService.addToReadingList(bookId, book);
        setIsInReadingList(true);
      }
    } catch (err) {
      console.error('Reading list error:', err);
      alert('Failed to update reading list');
    }
  };

  const handleRecommend = () => {
    if (!isAuthenticated) {
      alert('Please log in to recommend books');
      return;
    }
    setShowRecommendForm(true);
  };

  const handleRecommendSubmit = async (recommendationData) => {
    try {
      // Pre-fill form with book data
      const bookRecommendation = {
        ...recommendationData,
        title: book.title,
        author: book.authors?.[0] || 'Unknown Author',
        coverUrl: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail,
        isbn: book.industryIdentifiers?.[0]?.identifier,
        publishedYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
        pageCount: book.pageCount,
        language: book.language
      };
      
      // This would integrate with your recommendation system
      console.log('Creating recommendation:', bookRecommendation);
      setShowRecommendForm(false);
      alert('Recommendation created successfully!');
    } catch (err) {
      console.error('Recommendation error:', err);
      alert('Failed to create recommendation');
    }
  };

  const handleAddReview = async () => {
    if (!isAuthenticated) {
      alert('Please log in to add reviews');
      return;
    }

    if (!newReview.trim()) {
      alert('Please enter a review');
      return;
    }

    try {
      const review = await bookDetailsService.addReview(bookId, newReview);
      setReviews([review, ...reviews]);
      setNewReview('');
    } catch (err) {
      console.error('Add review error:', err);
      alert('Failed to add review');
    }
  };

  if (loading) {
    return (
      <div className="book-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="book-details-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go Back
        </button>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-details-not-found">
        <h2>Book Not Found</h2>
        <p>The requested book could not be found.</p>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="book-details-page">
      <div className="book-details-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
      </div>

      <div className="book-details-content">
        <div className="book-details-main">
          <div className="book-cover-section">
            <div className="book-cover-container">
              {book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail ? (
                <img 
                  src={book.imageLinks.thumbnail || book.imageLinks.smallThumbnail} 
                  alt={book.title}
                  className="book-cover-large"
                />
              ) : (
                <div className="book-cover-placeholder">
                  <span>📚</span>
                  <p>No Cover Available</p>
                </div>
              )}
            </div>
            
            <div className="book-actions">
              <button 
                onClick={handleAddToReadingList}
                className={`action-button ${isInReadingList ? 'in-list' : ''}`}
              >
                {isInReadingList ? '✓ In Reading List' : '+ Add to Reading List'}
              </button>
              
              <button 
                onClick={handleRecommend}
                className="action-button recommend-button"
              >
                📝 Recommend This Book
              </button>
            </div>
          </div>

          <div className="book-info-section">
            <div className="book-header">
              <h1 className="book-title">{book.title}</h1>
              {book.subtitle && <h2 className="book-subtitle">{book.subtitle}</h2>}
              
              <div className="book-authors">
                {book.authors?.map((author, index) => (
                  <span key={index} className="author">
                    {author}
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))}
              </div>

              <div className="book-rating-section">
                <div className="rating-display">
                  <StarRating 
                    rating={averageRating} 
                    readOnly={true}
                    size="medium"
                  />
                  <span className="rating-text">
                    {averageRating.toFixed(1)} ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
                  </span>
                </div>
                
                {isAuthenticated && (
                  <div className="user-rating">
                    <label>Your Rating:</label>
                    <StarRating 
                      rating={userRating}
                      onRatingChange={handleRating}
                      size="medium"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="book-details-grid">
              <div className="book-description">
                <h3>Description</h3>
                <div 
                  className="description-text"
                  dangerouslySetInnerHTML={{ 
                    __html: book.description || 'No description available.' 
                  }}
                />
              </div>

              <div className="book-metadata">
                <h3>Book Information</h3>
                <div className="metadata-grid">
                  {book.publishedDate && (
                    <div className="metadata-item">
                      <span className="label">Published:</span>
                      <span className="value">{book.publishedDate}</span>
                    </div>
                  )}
                  
                  {book.publisher && (
                    <div className="metadata-item">
                      <span className="label">Publisher:</span>
                      <span className="value">{book.publisher}</span>
                    </div>
                  )}
                  
                  {book.pageCount && (
                    <div className="metadata-item">
                      <span className="label">Pages:</span>
                      <span className="value">{book.pageCount}</span>
                    </div>
                  )}
                  
                  {book.categories && book.categories.length > 0 && (
                    <div className="metadata-item">
                      <span className="label">Categories:</span>
                      <span className="value">{book.categories.join(', ')}</span>
                    </div>
                  )}
                  
                  {book.language && (
                    <div className="metadata-item">
                      <span className="label">Language:</span>
                      <span className="value">{book.language.toUpperCase()}</span>
                    </div>
                  )}
                  
                  {book.industryIdentifiers && book.industryIdentifiers.length > 0 && (
                    <div className="metadata-item">
                      <span className="label">ISBN:</span>
                      <span className="value">
                        {book.industryIdentifiers.map(id => id.identifier).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="book-reviews-section">
          <h3>Reviews</h3>
          
          {isAuthenticated && (
            <div className="add-review">
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Write your review..."
                className="review-textarea"
                rows="4"
              />
              <button onClick={handleAddReview} className="submit-review-button">
                Add Review
              </button>
            </div>
          )}

          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.userName}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-text">{review.text}</p>
                </div>
              ))
            ) : (
              <p className="no-reviews">No reviews yet. Be the first to review this book!</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation Form Modal */}
      {showRecommendForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <BookRecommendationForm
              initialData={{
                title: book.title,
                author: book.authors?.[0] || 'Unknown Author',
                coverUrl: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail
              }}
              onSubmit={handleRecommendSubmit}
              onCancel={() => setShowRecommendForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;
