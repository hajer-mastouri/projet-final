import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

class RecommendationApiService {
  /**
   * Get all public recommendations with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Recommendations with pagination info
   */
  async getRecommendations(params = {}) {
    try {
      const response = await api.get('/recommendations', { params });
      return response.data;
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recommendations');
    }
  }

  /**
   * Get current user's recommendations
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User's recommendations with pagination info
   */
  async getMyRecommendations(params = {}) {
    try {
      const response = await api.get('/recommendations/my', { params });
      return response.data;
    } catch (error) {
      console.error('Get my recommendations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch your recommendations');
    }
  }

  /**
   * Get a single recommendation by ID
   * @param {string} id - Recommendation ID
   * @returns {Promise<Object>} Recommendation details
   */
  async getRecommendationById(id) {
    try {
      const response = await api.get(`/recommendations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get recommendation by ID error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recommendation');
    }
  }

  /**
   * Create a new recommendation
   * @param {Object} recommendationData - Recommendation data
   * @returns {Promise<Object>} Created recommendation
   */
  async createRecommendation(recommendationData) {
    try {
      const response = await api.post('/recommendations', recommendationData);
      return response.data;
    } catch (error) {
      console.error('Create recommendation error:', error);
      if (error.response?.data?.errors) {
        // Validation errors
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg);
        throw new Error(errorMessages.join(', '));
      }
      throw new Error(error.response?.data?.message || 'Failed to create recommendation');
    }
  }

  /**
   * Update an existing recommendation
   * @param {string} id - Recommendation ID
   * @param {Object} recommendationData - Updated recommendation data
   * @returns {Promise<Object>} Updated recommendation
   */
  async updateRecommendation(id, recommendationData) {
    try {
      const response = await api.put(`/recommendations/${id}`, recommendationData);
      return response.data;
    } catch (error) {
      console.error('Update recommendation error:', error);
      if (error.response?.data?.errors) {
        // Validation errors
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg);
        throw new Error(errorMessages.join(', '));
      }
      throw new Error(error.response?.data?.message || 'Failed to update recommendation');
    }
  }

  /**
   * Delete a recommendation
   * @param {string} id - Recommendation ID
   * @returns {Promise<Object>} Success message
   */
  async deleteRecommendation(id) {
    try {
      const response = await api.delete(`/recommendations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete recommendation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete recommendation');
    }
  }

  /**
   * Toggle like on a recommendation
   * @param {string} id - Recommendation ID
   * @returns {Promise<Object>} Like status and count
   */
  async toggleLike(id) {
    try {
      const response = await api.post(`/recommendations/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Toggle like error:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle like');
    }
  }

  /**
   * Add a comment to a recommendation
   * @param {string} id - Recommendation ID
   * @param {string} comment - Comment text
   * @returns {Promise<Object>} Added comment
   */
  async addComment(id, comment) {
    try {
      const response = await api.post(`/recommendations/${id}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error('Add comment error:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg);
        throw new Error(errorMessages.join(', '));
      }
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  /**
   * Get genre statistics
   * @returns {Promise<Array>} Genre statistics
   */
  async getGenreStats() {
    try {
      const response = await api.get('/recommendations/genres/stats');
      return response.data;
    } catch (error) {
      console.error('Get genre stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch genre statistics');
    }
  }

  /**
   * Get featured recommendations
   * @param {number} limit - Number of recommendations to fetch
   * @returns {Promise<Object>} Featured recommendations
   */
  async getFeaturedRecommendations(limit = 5) {
    try {
      const response = await api.get('/recommendations', { 
        params: { featured: 'true', limit } 
      });
      return response.data;
    } catch (error) {
      console.error('Get featured recommendations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch featured recommendations');
    }
  }

  /**
   * Search recommendations with advanced filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchRecommendations(searchParams) {
    try {
      const response = await api.get('/recommendations', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Search recommendations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to search recommendations');
    }
  }

  /**
   * Get recommendations by genre
   * @param {string} genre - Genre name
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Recommendations in genre
   */
  async getRecommendationsByGenre(genre, params = {}) {
    try {
      const response = await api.get('/recommendations', { 
        params: { ...params, genre } 
      });
      return response.data;
    } catch (error) {
      console.error('Get recommendations by genre error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recommendations by genre');
    }
  }

  /**
   * Get recommendations with high ratings
   * @param {number} minRating - Minimum rating (default: 4)
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} High-rated recommendations
   */
  async getHighRatedRecommendations(minRating = 4, params = {}) {
    try {
      const response = await api.get('/recommendations', { 
        params: { ...params, minRating, sortBy: 'rating', sortOrder: 'desc' } 
      });
      return response.data;
    } catch (error) {
      console.error('Get high-rated recommendations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch high-rated recommendations');
    }
  }

  /**
   * Get recent recommendations
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Recent recommendations
   */
  async getRecentRecommendations(params = {}) {
    try {
      const response = await api.get('/recommendations', { 
        params: { ...params, sortBy: 'createdAt', sortOrder: 'desc' } 
      });
      return response.data;
    } catch (error) {
      console.error('Get recent recommendations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recent recommendations');
    }
  }
}

// Create and export a singleton instance
const recommendationApiService = new RecommendationApiService();
export default recommendationApiService;
