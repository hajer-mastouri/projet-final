import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import SocialActions from './SocialActions';
import './BookCard.css';

const BookCard = ({ 
  book, 
  showActions = true, 
  showSocialActions = true,
  size = 'medium',
  onAddToList,
  onViewDetails 
}) => {
  const {
    _id,
    title,
    author,
    description,
    rating,
    coverUrl,
    likeCount = 0,
    commentCount = 0,
    shareCount = 0,
    isLiked = false
  } = book;

  const handleAddToList = () => {
    if (onAddToList) {
      onAddToList(book);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(book);
    }
  };

  return (
    <div className={`book-card book-card-${size}`}>
      {/* Book Cover */}
      <div className="book-cover-container">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={`${title} cover`}
            className="book-cover"
            loading="lazy"
          />
        ) : (
          <div className="book-cover book-cover-placeholder">
            📚
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="book-cover-overlay">
          <Link 
            to={`/book/${_id}`}
            className="quick-view-btn"
            title="View Details"
          >
            👁️
          </Link>
        </div>
      </div>

      {/* Book Info */}
      <div className="book-info">
        <h3 className="book-title">
          <Link to={`/book/${_id}`} className="book-title-link">
            {title}
          </Link>
        </h3>
        
        <p className="book-author">by {author}</p>
        
        {description && (
          <p className="book-description">
            {description}
          </p>
        )}
        
        {/* Rating */}
        {rating && (
          <div className="book-rating">
            <StarRating rating={rating} readOnly size="small" />
            <span className="rating-value">{rating.toFixed(1)}</span>
          </div>
        )}
        
        {/* Social Actions */}
        {showSocialActions && (
          <div className="book-social">
            <SocialActions
              targetType="recommendation"
              targetId={_id}
              initialLikeCount={likeCount}
              initialCommentCount={commentCount}
              initialShareCount={shareCount}
              initialIsLiked={isLiked}
              size="small"
            />
          </div>
        )}
        
        {/* Action Buttons */}
        {showActions && (
          <div className="book-actions">
            <Link 
              to={`/book/${_id}`}
              className="action-btn action-btn-primary"
            >
              📖 View Details
            </Link>
            
            {onAddToList && (
              <button 
                onClick={handleAddToList}
                className="action-btn action-btn-secondary"
                title="Add to Reading List"
              >
                ➕ Add to List
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Compact version for lists
export const BookCardCompact = ({ book, onSelect }) => {
  const { _id, title, author, coverUrl, rating } = book;
  
  return (
    <div className="book-card-compact" onClick={() => onSelect?.(book)}>
      <div className="compact-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={`${title} cover`} />
        ) : (
          <div className="compact-cover-placeholder">📚</div>
        )}
      </div>
      
      <div className="compact-info">
        <h4 className="compact-title">{title}</h4>
        <p className="compact-author">{author}</p>
        {rating && (
          <div className="compact-rating">
            <StarRating rating={rating} readOnly size="tiny" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Grid container for book cards
export const BookGrid = ({ books, children, columns = 'auto' }) => {
  const gridClass = columns === 'auto' 
    ? 'book-grid-auto' 
    : `book-grid-${columns}`;
    
  return (
    <div className={`book-grid ${gridClass}`}>
      {children || books?.map(book => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
};

export default BookCard;
