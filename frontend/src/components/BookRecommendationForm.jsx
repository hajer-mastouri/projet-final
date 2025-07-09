import React, { useState } from 'react';
import BookSearch from './BookSearch';
import './BookRecommendationForm.css';

const BookRecommendationForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    author: initialData?.author || '',
    description: initialData?.description || '',
    rating: initialData?.rating || 5,
    genre: initialData?.genre || '',
    coverUrl: initialData?.coverUrl || '',
    isbn: initialData?.isbn || '',
    publishedYear: initialData?.publishedYear || '',
    pageCount: initialData?.pageCount || '',
    language: initialData?.language || 'English',
    tags: initialData?.tags || [],
    personalNotes: initialData?.personalNotes || '',
    recommendationReason: initialData?.recommendationReason || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  // Predefined genres for dropdown
  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Thriller', 'Biography', 'History', 'Self-Help',
    'Business', 'Technology', 'Health', 'Travel', 'Cooking',
    'Art', 'Poetry', 'Drama', 'Horror', 'Adventure'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Arabic'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleBookSelect = (book) => {
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.authors.join(', '),
      description: book.description,
      genre: book.categories[0] || '',
      coverUrl: book.thumbnail || '',
      isbn: book.isbn.isbn13 || book.isbn.isbn10 || '',
      publishedYear: book.publishedDate ? new Date(book.publishedDate).getFullYear().toString() : '',
      pageCount: book.pageCount ? book.pageCount.toString() : '',
      language: book.language === 'en' ? 'English' : book.language
    }));
    setShowBookSearch(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.genre.trim()) {
      newErrors.genre = 'Genre is required';
    }

    if (!formData.recommendationReason.trim()) {
      newErrors.recommendationReason = 'Please explain why you recommend this book';
    }

    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }

    if (formData.publishedYear && (isNaN(formData.publishedYear) || formData.publishedYear < 1000 || formData.publishedYear > new Date().getFullYear())) {
      newErrors.publishedYear = 'Please enter a valid year';
    }

    if (formData.pageCount && (isNaN(formData.pageCount) || formData.pageCount < 1)) {
      newErrors.pageCount = 'Page count must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : null,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
        tags: formData.tags.filter(tag => tag.trim())
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Failed to submit recommendation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= formData.rating ? 'active' : ''}`}
            onClick={() => handleRatingChange(star)}
          >
            ★
          </button>
        ))}
        <span className="rating-text">({formData.rating}/5)</span>
      </div>
    );
  };

  if (showBookSearch) {
    return (
      <div className="book-recommendation-form">
        <div className="form-header">
          <h2>Search for a Book</h2>
          <button 
            type="button" 
            onClick={() => setShowBookSearch(false)}
            className="back-button"
          >
            ← Back to Form
          </button>
        </div>
        <BookSearch onBookSelect={handleBookSelect} showSelectButton={true} />
      </div>
    );
  }

  return (
    <div className="book-recommendation-form">
      <div className="form-header">
        <h2>{initialData ? 'Edit Book Recommendation' : 'Add Book Recommendation'}</h2>
        <button 
          type="button" 
          onClick={() => setShowBookSearch(true)}
          className="search-book-button"
        >
          🔍 Search for Book
        </button>
      </div>

      <form onSubmit={handleSubmit} className="recommendation-form">
        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Book Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="Enter book title"
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className={errors.author ? 'error' : ''}
              placeholder="Enter author name"
            />
            {errors.author && <span className="error-text">{errors.author}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Book Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={errors.description ? 'error' : ''}
            placeholder="Describe the book (minimum 50 characters)"
            rows="4"
          />
          <div className="char-count">
            {formData.description.length} characters
          </div>
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="genre">Genre *</label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              className={errors.genre ? 'error' : ''}
            >
              <option value="">Select a genre</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            {errors.genre && <span className="error-text">{errors.genre}</span>}
          </div>

          <div className="form-group">
            <label>Your Rating *</label>
            {renderStarRating()}
            {errors.rating && <span className="error-text">{errors.rating}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recommendationReason">Why do you recommend this book? *</label>
          <textarea
            id="recommendationReason"
            name="recommendationReason"
            value={formData.recommendationReason}
            onChange={handleInputChange}
            className={errors.recommendationReason ? 'error' : ''}
            placeholder="Explain why others should read this book"
            rows="3"
          />
          {errors.recommendationReason && <span className="error-text">{errors.recommendationReason}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="publishedYear">Published Year</label>
            <input
              type="number"
              id="publishedYear"
              name="publishedYear"
              value={formData.publishedYear}
              onChange={handleInputChange}
              className={errors.publishedYear ? 'error' : ''}
              placeholder="e.g., 2023"
              min="1000"
              max={new Date().getFullYear()}
            />
            {errors.publishedYear && <span className="error-text">{errors.publishedYear}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="pageCount">Page Count</label>
            <input
              type="number"
              id="pageCount"
              name="pageCount"
              value={formData.pageCount}
              onChange={handleInputChange}
              className={errors.pageCount ? 'error' : ''}
              placeholder="Number of pages"
              min="1"
            />
            {errors.pageCount && <span className="error-text">{errors.pageCount}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              value={formData.isbn}
              onChange={handleInputChange}
              placeholder="ISBN-10 or ISBN-13"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="coverUrl">Book Cover URL</label>
          <input
            type="url"
            id="coverUrl"
            name="coverUrl"
            value={formData.coverUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/book-cover.jpg"
          />
          {formData.coverUrl && (
            <div className="cover-preview">
              <img src={formData.coverUrl} alt="Book cover preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tags-input">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <button type="button" onClick={handleAddTag}>Add</button>
          </div>
          <div className="tags-list">
            {formData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="personalNotes">Personal Notes</label>
          <textarea
            id="personalNotes"
            name="personalNotes"
            value={formData.personalNotes}
            onChange={handleInputChange}
            placeholder="Any personal thoughts or notes about this book"
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (initialData ? 'Update Recommendation' : 'Add Recommendation')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookRecommendationForm;
