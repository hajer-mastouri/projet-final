import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import socialApiService from '../services/socialApi';
import './SocialActions.css';

const SocialActions = ({ 
  targetType, 
  targetId, 
  initialLikeCount = 0, 
  initialCommentCount = 0,
  initialShareCount = 0,
  initialIsLiked = false,
  showComments = true,
  showShare = true,
  size = 'medium'
}) => {
  const { user, isAuthenticated } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setCommentCount(initialCommentCount);
    setShareCount(initialShareCount);
    setIsLiked(initialIsLiked);
  }, [initialLikeCount, initialCommentCount, initialShareCount, initialIsLiked]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like items');
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      const result = await socialApiService.toggleLike(targetType, targetId);
      
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (!isAuthenticated) {
      alert('Please log in to share items');
      return;
    }
    setShowShareModal(true);
  };

  const handleComments = () => {
    setShowCommentsModal(true);
  };

  const handleShareSuccess = (newShareCount) => {
    setShareCount(newShareCount || shareCount + 1);
    setShowShareModal(false);
  };

  const handleCommentSuccess = (newCommentCount) => {
    setCommentCount(newCommentCount || commentCount + 1);
  };

  return (
    <div className={`social-actions social-actions-${size}`}>
      {/* Like Button */}
      <button
        className={`social-action-btn like-btn ${isLiked ? 'liked' : ''} ${isLiking ? 'loading' : ''}`}
        onClick={handleLike}
        disabled={isLiking}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <span className="action-icon">
          {isLiked ? '❤️' : '🤍'}
        </span>
        <span className="action-count">{likeCount}</span>
        <span className="action-label">Like{likeCount !== 1 ? 's' : ''}</span>
      </button>

      {/* Comment Button */}
      {showComments && (
        <button
          className="social-action-btn comment-btn"
          onClick={handleComments}
          title="Comments"
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{commentCount}</span>
          <span className="action-label">Comment{commentCount !== 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Share Button */}
      {showShare && (
        <button
          className="social-action-btn share-btn"
          onClick={handleShare}
          title="Share"
        >
          <span className="action-icon">📤</span>
          <span className="action-count">{shareCount}</span>
          <span className="action-label">Share{shareCount !== 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          targetType={targetType}
          targetId={targetId}
          onClose={() => setShowShareModal(false)}
          onSuccess={handleShareSuccess}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && (
        <CommentsModal
          targetType={targetType}
          targetId={targetId}
          onClose={() => setShowCommentsModal(false)}
          onCommentAdded={handleCommentSuccess}
        />
      )}
    </div>
  );
};

// Share Modal Component
const ShareModal = ({ targetType, targetId, onClose, onSuccess }) => {
  const [shareType, setShareType] = useState('internal');
  const [platform, setPlatform] = useState('');
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    
    try {
      setIsSharing(true);
      const result = await socialApiService.shareContent({
        targetType,
        targetId,
        shareType,
        platform,
        message
      });
      
      if (shareType === 'external' && result.shareUrl) {
        // For external shares, open the share URL or copy to clipboard
        if (platform === 'copy_link') {
          navigator.clipboard.writeText(result.shareUrl);
          alert('Link copied to clipboard!');
        } else if (platform === 'twitter') {
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(result.shareText)}&url=${encodeURIComponent(result.shareUrl)}`;
          window.open(twitterUrl, '_blank');
        } else if (platform === 'facebook') {
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(result.shareUrl)}`;
          window.open(facebookUrl, '_blank');
        }
      }
      
      onSuccess();
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share content');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share this {targetType}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleShare} className="share-form">
          <div className="share-options">
            <div className="share-type-section">
              <label>Share Type:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="internal"
                    checked={shareType === 'internal'}
                    onChange={(e) => setShareType(e.target.value)}
                  />
                  Internal (within app)
                </label>
                <label>
                  <input
                    type="radio"
                    value="external"
                    checked={shareType === 'external'}
                    onChange={(e) => setShareType(e.target.value)}
                  />
                  External (social media)
                </label>
              </div>
            </div>

            {shareType === 'external' && (
              <div className="platform-section">
                <label>Platform:</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  required
                >
                  <option value="">Select platform</option>
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="copy_link">Copy Link</option>
                </select>
              </div>
            )}

            <div className="message-section">
              <label>Message (optional):</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                maxLength={500}
                rows={3}
              />
              <small>{message.length}/500 characters</small>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="share-submit-btn"
              disabled={isSharing || (shareType === 'external' && !platform)}
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ targetType, targetId, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await socialApiService.getComments(targetType, targetId);
      setComments(result.comments);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const result = await socialApiService.addComment({
        targetType,
        targetId,
        text: newComment.trim()
      });
      
      setComments([result.comment, ...comments]);
      setNewComment('');
      onCommentAdded(comments.length + 1);
    } catch (error) {
      console.error('Add comment error:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content comments-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Comments</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="comments-content">
          <form onSubmit={handleAddComment} className="add-comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              maxLength={1000}
            />
            <div className="comment-form-actions">
              <small>{newComment.length}/1000 characters</small>
              <button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                className="add-comment-btn"
              >
                {isSubmitting ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </form>

          <div className="comments-list">
            {loading ? (
              <div className="loading">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">No comments yet. Be the first to comment!</div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                  <div className="comment-actions">
                    <SocialActions
                      targetType="comment"
                      targetId={comment._id}
                      initialLikeCount={comment.likeCount || 0}
                      showComments={false}
                      showShare={false}
                      size="small"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialActions;
