import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import bookApiService from '../services/bookApi';
import './BookSearch.css';

const BookSearch = ({ onBookSelect, showSelectButton = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  // Advanced search criteria
  const [advancedSearch, setAdvancedSearch] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const RESULTS_PER_PAGE = 12;

  // Debounced search function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const performSearch = useCallback(async (searchQuery, page = 0, isNewSearch = true) => {
    if (!searchQuery.trim() && searchType === 'general') return;
    
    setLoading(true);
    setError(null);

    try {
      let searchResults;
      const startIndex = page * RESULTS_PER_PAGE;

      if (searchType === 'advanced') {
        // Check if at least one advanced field is filled
        const hasAdvancedCriteria = Object.values(advancedSearch).some(value => value.trim());
        if (!hasAdvancedCriteria) {
          setError('Please fill at least one search field');
          setLoading(false);
          return;
        }
        
        searchResults = await bookApiService.searchBooksByCriteria(
          advancedSearch,
          RESULTS_PER_PAGE
        );
      } else {
        searchResults = await bookApiService.searchBooks(
          searchQuery,
          RESULTS_PER_PAGE,
          startIndex
        );
      }

      if (isNewSearch) {
        setResults(searchResults.books);
        setCurrentPage(0);
      } else {
        setResults(prev => [...prev, ...searchResults.books]);
      }

      setHasMore(searchResults.hasMore);
      setTotalResults(searchResults.totalItems);
    } catch (err) {
      setError(err.message);
      if (isNewSearch) {
        setResults([]);
        setTotalResults(0);
      }
    } finally {
      setLoading(false);
    }
  }, [searchType, advancedSearch]);

  const debouncedSearch = useCallback(
    debounce((searchQuery) => performSearch(searchQuery, 0, true), 500),
    [performSearch]
  );

  // Handle general search input change
  useEffect(() => {
    if (searchType === 'general' && query.trim()) {
      debouncedSearch(query);
    } else if (searchType === 'general' && !query.trim()) {
      setResults([]);
      setTotalResults(0);
    }
  }, [query, searchType, debouncedSearch]);

  const handleAdvancedSearch = () => {
    performSearch('', 0, true);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    performSearch(query, nextPage, false);
  };

  const handleBookSelect = (book) => {
    if (onBookSelect) {
      onBookSelect(book);
    }
  };

  const handleViewDetails = (book) => {
    navigate(`/book/${book.id}`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setTotalResults(0);
    setAdvancedSearch({ title: '', author: '', genre: '', isbn: '' });
  };

  const renderBookCard = (book) => (
    <div key={book.id} className="book-card">
      <div className="book-image">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt={book.title} />
        ) : (
          <div className="no-image">📚</div>
        )}
      </div>
      
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-authors">
          by {book.authors.join(', ')}
        </p>
        
        {book.publishedDate && (
          <p className="book-date">Published: {book.publishedDate}</p>
        )}
        
        {book.categories.length > 0 && (
          <div className="book-categories">
            {book.categories.slice(0, 2).map((category, index) => (
              <span key={index} className="category-tag">
                {category}
              </span>
            ))}
          </div>
        )}
        
        {book.averageRating && (
          <div className="book-rating">
            <span className="stars">
              {'★'.repeat(Math.floor(book.averageRating))}
              {'☆'.repeat(5 - Math.floor(book.averageRating))}
            </span>
            <span className="rating-text">
              {book.averageRating} ({book.ratingsCount} reviews)
            </span>
          </div>
        )}
        
        <p className="book-description">
          {book.description.length > 150 
            ? `${book.description.substring(0, 150)}...` 
            : book.description}
        </p>
        
        <div className="book-actions">
          <button
            className="view-details-btn"
            onClick={() => handleViewDetails(book)}
          >
            View Details
          </button>

          {showSelectButton && (
            <button
              className="select-book-btn"
              onClick={() => handleBookSelect(book)}
            >
              Select Book
            </button>
          )}

          {book.previewLink && (
            <a
              href={book.previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="preview-link"
            >
              Preview
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="book-search">
      <div className="search-header">
        <h2>Search Books</h2>
        
        <div className="search-type-toggle">
          <button 
            className={searchType === 'general' ? 'active' : ''}
            onClick={() => setSearchType('general')}
          >
            General Search
          </button>
          <button 
            className={searchType === 'advanced' ? 'active' : ''}
            onClick={() => setSearchType('advanced')}
          >
            Advanced Search
          </button>
        </div>
      </div>

      {searchType === 'general' ? (
        <div className="general-search">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or keywords..."
              className="search-input"
            />
            <button 
              onClick={clearSearch}
              className="clear-button"
              disabled={!query && results.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="advanced-search">
          <div className="advanced-fields">
            <input
              type="text"
              value={advancedSearch.title}
              onChange={(e) => setAdvancedSearch(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Book title..."
              className="search-input"
            />
            <input
              type="text"
              value={advancedSearch.author}
              onChange={(e) => setAdvancedSearch(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Author name..."
              className="search-input"
            />
            <input
              type="text"
              value={advancedSearch.genre}
              onChange={(e) => setAdvancedSearch(prev => ({ ...prev, genre: e.target.value }))}
              placeholder="Genre/Subject..."
              className="search-input"
            />
            <input
              type="text"
              value={advancedSearch.isbn}
              onChange={(e) => setAdvancedSearch(prev => ({ ...prev, isbn: e.target.value }))}
              placeholder="ISBN..."
              className="search-input"
            />
          </div>
          
          <div className="advanced-actions">
            <button 
              onClick={handleAdvancedSearch}
              className="search-button"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button 
              onClick={clearSearch}
              className="clear-button"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {totalResults > 0 && (
        <div className="search-stats">
          <p>Found {totalResults.toLocaleString()} books</p>
        </div>
      )}

      {loading && results.length === 0 && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Searching for books...</p>
        </div>
      )}

      <div className="search-results">
        {results.map(renderBookCard)}
      </div>

      {hasMore && !loading && (
        <div className="load-more">
          <button onClick={handleLoadMore} className="load-more-button">
            Load More Books
          </button>
        </div>
      )}

      {loading && results.length > 0 && (
        <div className="loading-more">
          <div className="loading-spinner small"></div>
          <p>Loading more books...</p>
        </div>
      )}
    </div>
  );
};

export default BookSearch;
