// Google Books API service
const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

class BookApiService {
  /**
   * Search for books using Google Books API
   * @param {string} query - Search query (title, author, or keywords)
   * @param {number} maxResults - Maximum number of results (default: 20)
   * @param {number} startIndex - Starting index for pagination (default: 0)
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(query, maxResults = 20, startIndex = 0) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
      }

      const encodedQuery = encodeURIComponent(query.trim());
      const url = `${GOOGLE_BOOKS_API_BASE}/volumes?q=${encodedQuery}&maxResults=${maxResults}&startIndex=${startIndex}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        totalItems: data.totalItems || 0,
        books: this.formatBookResults(data.items || []),
        hasMore: (startIndex + maxResults) < (data.totalItems || 0)
      };
    } catch (error) {
      console.error('Book search error:', error);
      throw new Error(`Failed to search books: ${error.message}`);
    }
  }

  /**
   * Search books by specific criteria
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.title - Book title
   * @param {string} criteria.author - Author name
   * @param {string} criteria.genre - Genre/subject
   * @param {string} criteria.isbn - ISBN number
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Object>} Search results
   */
  async searchBooksByCriteria(criteria, maxResults = 20) {
    try {
      const queryParts = [];
      
      if (criteria.title) {
        queryParts.push(`intitle:${criteria.title}`);
      }
      
      if (criteria.author) {
        queryParts.push(`inauthor:${criteria.author}`);
      }
      
      if (criteria.genre) {
        queryParts.push(`subject:${criteria.genre}`);
      }
      
      if (criteria.isbn) {
        queryParts.push(`isbn:${criteria.isbn}`);
      }
      
      if (queryParts.length === 0) {
        throw new Error('At least one search criterion is required');
      }
      
      const query = queryParts.join('+');
      return await this.searchBooks(query, maxResults);
    } catch (error) {
      console.error('Criteria search error:', error);
      throw error;
    }
  }

  /**
   * Get book details by Google Books ID
   * @param {string} bookId - Google Books volume ID
   * @returns {Promise<Object>} Book details
   */
  async getBookById(bookId) {
    try {
      if (!bookId) {
        throw new Error('Book ID is required');
      }

      const url = `${GOOGLE_BOOKS_API_BASE}/volumes/${bookId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Book not found');
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.formatSingleBook(data);
    } catch (error) {
      console.error('Get book by ID error:', error);
      throw new Error(`Failed to get book details: ${error.message}`);
    }
  }

  /**
   * Format book results from Google Books API response
   * @param {Array} items - Raw API response items
   * @returns {Array} Formatted book objects
   */
  formatBookResults(items) {
    return items.map(item => this.formatSingleBook(item));
  }

  /**
   * Format a single book from Google Books API response
   * @param {Object} item - Raw book item from API
   * @returns {Object} Formatted book object
   */
  formatSingleBook(item) {
    const volumeInfo = item.volumeInfo || {};
    const saleInfo = item.saleInfo || {};
    
    return {
      id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors || ['Unknown Author'],
      description: volumeInfo.description || 'No description available',
      publishedDate: volumeInfo.publishedDate || null,
      publisher: volumeInfo.publisher || 'Unknown Publisher',
      pageCount: volumeInfo.pageCount || null,
      categories: volumeInfo.categories || [],
      averageRating: volumeInfo.averageRating || null,
      ratingsCount: volumeInfo.ratingsCount || 0,
      language: volumeInfo.language || 'en',
      isbn: this.extractISBN(volumeInfo.industryIdentifiers || []),
      thumbnail: this.getBestThumbnail(volumeInfo.imageLinks),
      previewLink: volumeInfo.previewLink || null,
      infoLink: volumeInfo.infoLink || null,
      buyLink: saleInfo.buyLink || null,
      price: saleInfo.listPrice ? {
        amount: saleInfo.listPrice.amount,
        currency: saleInfo.listPrice.currencyCode
      } : null
    };
  }

  /**
   * Extract ISBN from industry identifiers
   * @param {Array} identifiers - Industry identifiers array
   * @returns {Object} ISBN object with ISBN_10 and ISBN_13
   */
  extractISBN(identifiers) {
    const isbn = { isbn10: null, isbn13: null };
    
    identifiers.forEach(identifier => {
      if (identifier.type === 'ISBN_10') {
        isbn.isbn10 = identifier.identifier;
      } else if (identifier.type === 'ISBN_13') {
        isbn.isbn13 = identifier.identifier;
      }
    });
    
    return isbn;
  }

  /**
   * Get the best available thumbnail image
   * @param {Object} imageLinks - Image links object from API
   * @returns {string|null} Best thumbnail URL
   */
  getBestThumbnail(imageLinks) {
    if (!imageLinks) return null;
    
    // Priority order: large, medium, small, thumbnail
    return imageLinks.large || 
           imageLinks.medium || 
           imageLinks.small || 
           imageLinks.thumbnail || 
           null;
  }

  /**
   * Get popular books by category
   * @param {string} category - Book category/genre
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Object>} Popular books in category
   */
  async getPopularBooksByCategory(category, maxResults = 20) {
    try {
      const query = `subject:${category}`;
      return await this.searchBooks(query, maxResults);
    } catch (error) {
      console.error('Get popular books error:', error);
      throw error;
    }
  }

  /**
   * Get book suggestions based on a book
   * @param {string} bookTitle - Title of the reference book
   * @param {string} author - Author of the reference book
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Object>} Similar book suggestions
   */
  async getSimilarBooks(bookTitle, author, maxResults = 10) {
    try {
      // Search for books by the same author or similar titles
      const queries = [
        `inauthor:${author}`,
        `intitle:${bookTitle.split(' ').slice(0, 2).join(' ')}`
      ];
      
      const results = await Promise.all(
        queries.map(query => this.searchBooks(query, Math.ceil(maxResults / 2)))
      );
      
      // Combine and deduplicate results
      const allBooks = [];
      const seenIds = new Set();
      
      results.forEach(result => {
        result.books.forEach(book => {
          if (!seenIds.has(book.id)) {
            seenIds.add(book.id);
            allBooks.push(book);
          }
        });
      });
      
      return {
        totalItems: allBooks.length,
        books: allBooks.slice(0, maxResults),
        hasMore: false
      };
    } catch (error) {
      console.error('Get similar books error:', error);
      throw error;
    }
  }

  /**
   * Get book by ID from Google Books API
   * @param {string} bookId - Google Books ID
   * @returns {Promise<Object>} Book details
   */
  async getBookById(bookId) {
    try {
      const response = await fetch(`${this.baseURL}/${bookId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get book by ID error:', error);
      throw new Error('Failed to fetch book details');
    }
  }
}

// Create and export a singleton instance
const bookApiService = new BookApiService();

export default bookApiService;
