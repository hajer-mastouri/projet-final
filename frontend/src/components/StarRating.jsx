import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readOnly = false, 
  size = 'medium',
  maxRating = 5,
  showText = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleStarClick = (starValue) => {
    if (readOnly || !onRatingChange) return;
    onRatingChange(starValue);
  };

  const handleStarHover = (starValue) => {
    if (readOnly) return;
    setHoverRating(starValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
    setIsHovering(false);
  };

  const getStarClass = (starIndex) => {
    const currentRating = isHovering ? hoverRating : rating;
    const baseClass = 'star';
    const sizeClass = `star-${size}`;
    
    let fillClass = '';
    if (currentRating >= starIndex) {
      fillClass = 'star-filled';
    } else if (currentRating > starIndex - 1 && currentRating < starIndex) {
      fillClass = 'star-half';
    } else {
      fillClass = 'star-empty';
    }
    
    const interactiveClass = !readOnly ? 'star-interactive' : '';
    
    return `${baseClass} ${sizeClass} ${fillClass} ${interactiveClass}`.trim();
  };

  const getRatingText = () => {
    const currentRating = isHovering ? hoverRating : rating;
    const ratingTexts = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratingTexts[currentRating] || '';
  };

  return (
    <div className={`star-rating star-rating-${size}`}>
      <div 
        className="stars-container"
        onMouseLeave={handleMouseLeave}
      >
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              className={getStarClass(starValue)}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              disabled={readOnly}
              aria-label={`Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
              title={readOnly ? `${rating} out of ${maxRating} stars` : `Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <span className="star-icon">★</span>
            </button>
          );
        })}
      </div>
      
      {showText && !readOnly && (
        <span className="rating-text">
          {getRatingText()}
        </span>
      )}
      
      {readOnly && rating > 0 && (
        <span className="rating-value">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
