import API from './api';

const bookDetailsService = {
  // Get book details from our database
  async getBookDetails(bookId) {
    try {
      const response = await API.get(`/books/${bookId}`);
      return response.data.book;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Book not found in our database
      }
      throw error;
    }
  },

  // Save book details to our database (from Google Books API)
  async saveBookDetails(bookData) {
    try {
      const response = await API.post('/books', {
        googleBooksId: bookData.id,
        title: bookData.volumeInfo?.title,
        subtitle: bookData.volumeInfo?.subtitle,
        authors: bookData.volumeInfo?.authors || [],
        description: bookData.volumeInfo?.description,
        publisher: bookData.volumeInfo?.publisher,
        publishedDate: bookData.volumeInfo?.publishedDate,
        pageCount: bookData.volumeInfo?.pageCount,
        categories: bookData.volumeInfo?.categories || [],
        language: bookData.volumeInfo?.language,
        imageLinks: bookData.volumeInfo?.imageLinks,
        industryIdentifiers: bookData.volumeInfo?.industryIdentifiers || [],
        previewLink: bookData.volumeInfo?.previewLink,
        infoLink: bookData.volumeInfo?.infoLink
      });
      return response.data.book;
    } catch (error) {
      console.error('Save book details error:', error);
      throw error;
    }
  },

  // Get user's rating for a book
  async getUserRating(bookId) {
    try {
      const response = await API.get(`/books/${bookId}/rating`);
      return response.data.rating;
    } catch (error) {
      if (error.response?.status === 404) {
        return 0; // No rating found
      }
      throw error;
    }
  },

  // Rate a book
  async rateBook(bookId, rating) {
    try {
      const response = await API.post(`/books/${bookId}/rating`, { rating });
      return response.data;
    } catch (error) {
      console.error('Rate book error:', error);
      throw error;
    }
  },

  // Check if book is in user's reading list
  async isInReadingList(bookId) {
    try {
      const response = await API.get(`/books/${bookId}/reading-list`);
      return response.data.inList;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  },

  // Add book to reading list
  async addToReadingList(bookId, bookData) {
    try {
      const response = await API.post(`/books/${bookId}/reading-list`, {
        title: bookData.title,
        authors: bookData.authors,
        imageLinks: bookData.imageLinks
      });
      return response.data;
    } catch (error) {
      console.error('Add to reading list error:', error);
      throw error;
    }
  },

  // Remove book from reading list
  async removeFromReadingList(bookId) {
    try {
      const response = await API.delete(`/books/${bookId}/reading-list`);
      return response.data;
    } catch (error) {
      console.error('Remove from reading list error:', error);
      throw error;
    }
  },

  // Add a review for a book
  async addReview(bookId, reviewText) {
    try {
      const response = await API.post(`/books/${bookId}/reviews`, {
        text: reviewText
      });
      return response.data.review;
    } catch (error) {
      console.error('Add review error:', error);
      throw error;
    }
  },

  // Get reviews for a book
  async getReviews(bookId, page = 1, limit = 10) {
    try {
      const response = await API.get(`/books/${bookId}/reviews`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get reviews error:', error);
      throw error;
    }
  },

  // Get book statistics
  async getBookStats(bookId) {
    try {
      const response = await API.get(`/books/${bookId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Get book stats error:', error);
      throw error;
    }
  },

  // Get similar books
  async getSimilarBooks(bookId, limit = 6) {
    try {
      const response = await API.get(`/books/${bookId}/similar`, {
        params: { limit }
      });
      return response.data.books;
    } catch (error) {
      console.error('Get similar books error:', error);
      throw error;
    }
  },

  // Get user's reading list
  async getReadingList(page = 1, limit = 20) {
    try {
      const response = await API.get('/books/reading-list', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get reading list error:', error);
      throw error;
    }
  },

  // Get popular books
  async getPopularBooks(limit = 10) {
    try {
      const response = await API.get('/books/popular', {
        params: { limit }
      });
      return response.data.books;
    } catch (error) {
      console.error('Get popular books error:', error);
      throw error;
    }
  },

  // Get recently rated books
  async getRecentlyRated(limit = 10) {
    try {
      const response = await API.get('/books/recently-rated', {
        params: { limit }
      });
      return response.data.books;
    } catch (error) {
      console.error('Get recently rated books error:', error);
      throw error;
    }
  }
};

export default bookDetailsService;
