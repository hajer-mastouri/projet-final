import API from './api';

const userProfileService = {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    try {
      const response = await API.get(`/users/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  /**
   * Update current user's profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    try {
      const response = await API.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Get user's reading statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Reading statistics
   */
  async getUserStats(userId) {
    try {
      const response = await API.get(`/users/${userId}/stats`);
      return response.data.stats;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  },

  /**
   * Get user's recommendations
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's recommendations
   */
  async getUserRecommendations(userId, options = {}) {
    try {
      const response = await API.get(`/users/${userId}/recommendations`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get user recommendations error:', error);
      throw error;
    }
  },

  /**
   * Get user's comments
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's comments
   */
  async getUserComments(userId, options = {}) {
    try {
      const response = await API.get(`/users/${userId}/comments`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get user comments error:', error);
      throw error;
    }
  },

  /**
   * Get user's reading list
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's reading list
   */
  async getUserReadingList(userId, options = {}) {
    try {
      const response = await API.get(`/users/${userId}/reading-list`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get user reading list error:', error);
      throw error;
    }
  },

  /**
   * Get user's activity feed
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's activity
   */
  async getUserActivity(userId, options = {}) {
    try {
      const response = await API.get(`/users/${userId}/activity`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get user activity error:', error);
      throw error;
    }
  },

  /**
   * Search users
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(query, options = {}) {
    try {
      const response = await API.get('/users/search', {
        params: { q: query, ...options }
      });
      return response.data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  /**
   * Get suggested users to follow
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Object>} Suggested users
   */
  async getSuggestedUsers(limit = 10) {
    try {
      const response = await API.get('/users/suggested', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get suggested users error:', error);
      throw error;
    }
  },

  /**
   * Upload profile picture
   * @param {File} file - Image file
   * @returns {Promise<Object>} Upload result
   */
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await API.post('/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  },

  /**
   * Update privacy settings
   * @param {Object} privacySettings - Privacy settings
   * @returns {Promise<Object>} Updated settings
   */
  async updatePrivacySettings(privacySettings) {
    try {
      const response = await API.put('/users/privacy', privacySettings);
      return response.data;
    } catch (error) {
      console.error('Update privacy settings error:', error);
      throw error;
    }
  },

  /**
   * Update notification preferences
   * @param {Object} notificationSettings - Notification settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateNotificationSettings(notificationSettings) {
    try {
      const response = await API.put('/users/notifications', notificationSettings);
      return response.data;
    } catch (error) {
      console.error('Update notification settings error:', error);
      throw error;
    }
  },

  /**
   * Get user's favorite genres
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Favorite genres
   */
  async getUserGenres(userId) {
    try {
      const response = await API.get(`/users/${userId}/genres`);
      return response.data;
    } catch (error) {
      console.error('Get user genres error:', error);
      throw error;
    }
  },

  /**
   * Update user's favorite genres
   * @param {Array} genres - Array of genre names
   * @returns {Promise<Object>} Updated genres
   */
  async updateFavoriteGenres(genres) {
    try {
      const response = await API.put('/users/genres', { genres });
      return response.data;
    } catch (error) {
      console.error('Update favorite genres error:', error);
      throw error;
    }
  },

  /**
   * Get user's reading goals
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Reading goals
   */
  async getReadingGoals(userId) {
    try {
      const response = await API.get(`/users/${userId}/goals`);
      return response.data;
    } catch (error) {
      console.error('Get reading goals error:', error);
      throw error;
    }
  },

  /**
   * Set reading goal
   * @param {Object} goalData - Goal data
   * @returns {Promise<Object>} Created goal
   */
  async setReadingGoal(goalData) {
    try {
      const response = await API.post('/users/goals', goalData);
      return response.data;
    } catch (error) {
      console.error('Set reading goal error:', error);
      throw error;
    }
  },

  /**
   * Get user's badges and achievements
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Badges and achievements
   */
  async getUserBadges(userId) {
    try {
      const response = await API.get(`/users/${userId}/badges`);
      return response.data;
    } catch (error) {
      console.error('Get user badges error:', error);
      throw error;
    }
  },

  /**
   * Get user's reading streaks
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Reading streaks
   */
  async getReadingStreaks(userId) {
    try {
      const response = await API.get(`/users/${userId}/streaks`);
      return response.data;
    } catch (error) {
      console.error('Get reading streaks error:', error);
      throw error;
    }
  }
};

export default userProfileService;
