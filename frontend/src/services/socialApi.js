import API from './api';

const socialApiService = {
  // LIKE OPERATIONS
  
  /**
   * Toggle like on a target (recommendation, comment, review)
   * @param {string} targetType - Type of target (recommendation, comment, review)
   * @param {string} targetId - ID of the target
   * @returns {Promise<Object>} Like result with liked status and count
   */
  async toggleLike(targetType, targetId) {
    try {
      const response = await API.post('/social/like', {
        targetType,
        targetId
      });
      return response.data;
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  },

  /**
   * Get likes for a target
   * @param {string} targetType - Type of target
   * @param {string} targetId - ID of the target
   * @param {number} limit - Number of likes to fetch
   * @returns {Promise<Object>} Likes data
   */
  async getLikes(targetType, targetId, limit = 10) {
    try {
      const response = await API.get(`/social/likes/${targetType}/${targetId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get likes error:', error);
      throw error;
    }
  },

  /**
   * Get user's liked items
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's likes
   */
  async getUserLikes(options = {}) {
    try {
      const response = await API.get('/social/user-likes', {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get user likes error:', error);
      throw error;
    }
  },

  // COMMENT OPERATIONS

  /**
   * Add a comment to a target
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Created comment
   */
  async addComment(commentData) {
    try {
      const response = await API.post('/social/comment', commentData);
      return response.data;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  /**
   * Get comments for a target
   * @param {string} targetType - Type of target
   * @param {string} targetId - ID of the target
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comments data
   */
  async getComments(targetType, targetId, options = {}) {
    try {
      const response = await API.get(`/social/comments/${targetType}/${targetId}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  },

  /**
   * Get replies to a comment
   * @param {string} commentId - ID of the parent comment
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Replies data
   */
  async getCommentReplies(commentId, options = {}) {
    try {
      const response = await API.get(`/social/comments/${commentId}/replies`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get comment replies error:', error);
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {string} commentId - ID of the comment to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteComment(commentId) {
    try {
      const response = await API.delete(`/social/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },

  // FOLLOW OPERATIONS

  /**
   * Toggle follow for a user
   * @param {string} followingId - ID of the user to follow/unfollow
   * @returns {Promise<Object>} Follow result
   */
  async toggleFollow(followingId) {
    try {
      const response = await API.post('/social/follow', {
        followingId
      });
      return response.data;
    } catch (error) {
      console.error('Toggle follow error:', error);
      throw error;
    }
  },

  /**
   * Get user's followers
   * @param {string} userId - ID of the user
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Followers data
   */
  async getFollowers(userId, options = {}) {
    try {
      const response = await API.get(`/social/followers/${userId}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get followers error:', error);
      throw error;
    }
  },

  /**
   * Get users that a user is following
   * @param {string} userId - ID of the user
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Following data
   */
  async getFollowing(userId, options = {}) {
    try {
      const response = await API.get(`/social/following/${userId}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get following error:', error);
      throw error;
    }
  },

  /**
   * Get suggested users to follow
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Object>} Suggested users
   */
  async getSuggestedFollows(limit = 10) {
    try {
      const response = await API.get('/social/suggested-follows', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get suggested follows error:', error);
      throw error;
    }
  },

  // SHARE OPERATIONS

  /**
   * Share content
   * @param {Object} shareData - Share data
   * @returns {Promise<Object>} Share result
   */
  async shareContent(shareData) {
    try {
      const response = await API.post('/social/share', shareData);
      return response.data;
    } catch (error) {
      console.error('Share content error:', error);
      throw error;
    }
  },

  /**
   * Get shares for a target
   * @param {string} targetType - Type of target
   * @param {string} targetId - ID of the target
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Shares data
   */
  async getShares(targetType, targetId, options = {}) {
    try {
      const response = await API.get(`/social/shares/${targetType}/${targetId}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get shares error:', error);
      throw error;
    }
  },

  /**
   * Get user's shares
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's shares
   */
  async getUserShares(options = {}) {
    try {
      const response = await API.get('/social/user-shares', {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get user shares error:', error);
      throw error;
    }
  },

  /**
   * Get shares received by user
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Received shares
   */
  async getReceivedShares(options = {}) {
    try {
      const response = await API.get('/social/received-shares', {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Get received shares error:', error);
      throw error;
    }
  },

  /**
   * Track share click
   * @param {string} shareId - ID of the share
   * @returns {Promise<Object>} Click tracking result
   */
  async trackShareClick(shareId) {
    try {
      const response = await API.post(`/social/shares/${shareId}/click`);
      return response.data;
    } catch (error) {
      console.error('Track share click error:', error);
      throw error;
    }
  },

  // UTILITY METHODS

  /**
   * Check if user has liked a target
   * @param {string} targetType - Type of target
   * @param {string} targetId - ID of the target
   * @returns {Promise<boolean>} Whether user has liked the target
   */
  async hasUserLiked(targetType, targetId) {
    try {
      const likes = await this.getUserLikes({
        targetType,
        limit: 1
      });
      
      return likes.likes.some(like => 
        like.targetType === targetType && 
        like.targetId === targetId
      );
    } catch (error) {
      console.error('Check user liked error:', error);
      return false;
    }
  },

  /**
   * Check if user is following another user
   * @param {string} userId - ID of the user to check
   * @returns {Promise<boolean>} Whether user is following the target user
   */
  async isFollowing(userId) {
    try {
      const following = await this.getFollowing(userId, { limit: 1 });
      return following.following.length > 0;
    } catch (error) {
      console.error('Check is following error:', error);
      return false;
    }
  }
};

export default socialApiService;
