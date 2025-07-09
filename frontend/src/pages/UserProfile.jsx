import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SocialActions from '../components/SocialActions';
import StarRating from '../components/StarRating';
import userProfileService from '../services/userProfileApi';
import socialApiService from '../services/socialApi';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Tab data
  const [recommendations, setRecommendations] = useState([]);
  const [likedBooks, setLikedBooks] = useState([]);
  const [comments, setComments] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [readingStats, setReadingStats] = useState({});

  const isOwnProfile = currentUser && currentUser.userId === userId;

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserStats();
      if (isAuthenticated && !isOwnProfile) {
        checkFollowStatus();
      }
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (user) {
      loadTabData();
    }
  }, [activeTab, user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userProfileService.getUserProfile(userId);
      setUser(userData.user);
      setFollowersCount(userData.user.followersCount || 0);
      setFollowingCount(userData.user.followingCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await userProfileService.getUserStats(userId);
      setReadingStats(stats);
    } catch (err) {
      console.error('Load user stats error:', err);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const result = await socialApiService.isFollowing(userId);
      setIsFollowing(result);
    } catch (err) {
      console.error('Check follow status error:', err);
    }
  };

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'recommendations':
          const recsData = await userProfileService.getUserRecommendations(userId);
          setRecommendations(recsData.recommendations);
          break;
        case 'liked':
          const likesData = await socialApiService.getUserLikes({ targetType: 'recommendation' });
          setLikedBooks(likesData.likes);
          break;
        case 'comments':
          const commentsData = await userProfileService.getUserComments(userId);
          setComments(commentsData.comments);
          break;
        case 'followers':
          const followersData = await socialApiService.getFollowers(userId);
          setFollowers(followersData.followers);
          break;
        case 'following':
          const followingData = await socialApiService.getFollowing(userId);
          setFollowing(followingData.following);
          break;
      }
    } catch (err) {
      console.error('Load tab data error:', err);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      alert('Please log in to follow users');
      return;
    }

    try {
      const result = await socialApiService.toggleFollow(userId);
      setIsFollowing(result.following);
      setFollowersCount(result.followersCount);
    } catch (err) {
      console.error('Follow error:', err);
      alert('Failed to update follow status');
    }
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go Back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-not-found">
        <h2>User Not Found</h2>
        <p>The requested user profile could not be found.</p>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-info">
            <div className="profile-avatar">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="profile-details">
              <h1 className="profile-name">{user.name}</h1>
              {user.bio && <p className="profile-bio">{user.bio}</p>}
              
              <div className="profile-meta">
                {user.location && (
                  <span className="meta-item">
                    📍 {user.location}
                  </span>
                )}
                {user.website && (
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="meta-item website-link"
                  >
                    🌐 Website
                  </a>
                )}
                <span className="meta-item">
                  📅 Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="profile-actions">
              {isOwnProfile ? (
                <button onClick={handleEditProfile} className="edit-profile-btn">
                  Edit Profile
                </button>
              ) : (
                <button 
                  onClick={handleFollow}
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Profile Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{user.recommendationsCount || 0}</span>
            <span className="stat-label">Recommendations</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{followersCount}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{followingCount}</span>
            <span className="stat-label">Following</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{readingStats.totalBooksRead || 0}</span>
            <span className="stat-label">Books Read</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{user.likesReceivedCount || 0}</span>
            <span className="stat-label">Likes Received</span>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <div className="tab-nav">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'recommendations', label: 'Recommendations' },
            { key: 'liked', label: 'Liked Books' },
            { key: 'comments', label: 'Comments' },
            { key: 'followers', label: 'Followers' },
            { key: 'following', label: 'Following' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <OverviewTab 
              user={user} 
              readingStats={readingStats}
              recommendations={recommendations.slice(0, 3)}
              likedBooks={likedBooks.slice(0, 3)}
            />
          )}
          
          {activeTab === 'recommendations' && (
            <RecommendationsTab recommendations={recommendations} />
          )}
          
          {activeTab === 'liked' && (
            <LikedBooksTab likedBooks={likedBooks} />
          )}
          
          {activeTab === 'comments' && (
            <CommentsTab comments={comments} />
          )}
          
          {activeTab === 'followers' && (
            <FollowersTab followers={followers} />
          )}
          
          {activeTab === 'following' && (
            <FollowingTab following={following} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ user, readingStats, recommendations, likedBooks }) => (
  <div className="overview-tab">
    <div className="overview-grid">
      <div className="overview-section">
        <h3>Reading Activity</h3>
        <div className="reading-activity">
          <div className="activity-item">
            <span className="activity-label">Books Read This Year:</span>
            <span className="activity-value">{readingStats.booksReadThisYear || 0}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Average Rating Given:</span>
            <span className="activity-value">
              {readingStats.averageRating ? (
                <StarRating rating={readingStats.averageRating} readOnly size="small" />
              ) : 'No ratings yet'}
            </span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Favorite Genres:</span>
            <span className="activity-value">
              {user.favoriteGenres?.join(', ') || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      <div className="overview-section">
        <h3>Recent Recommendations</h3>
        {recommendations.length > 0 ? (
          <div className="recent-recommendations">
            {recommendations.map(rec => (
              <div key={rec._id} className="mini-recommendation">
                <h4>{rec.title}</h4>
                <p>by {rec.author}</p>
                <StarRating rating={rec.rating} readOnly size="small" />
              </div>
            ))}
          </div>
        ) : (
          <p className="no-content">No recommendations yet</p>
        )}
      </div>

      <div className="overview-section">
        <h3>Recently Liked</h3>
        {likedBooks.length > 0 ? (
          <div className="recent-likes">
            {likedBooks.map(like => (
              <div key={like._id} className="mini-like">
                <span>Liked: {like.recommendationId?.title || 'Unknown'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-content">No liked books yet</p>
        )}
      </div>
    </div>
  </div>
);

// Other tab components would be implemented similarly...
const RecommendationsTab = ({ recommendations }) => (
  <div className="recommendations-tab">
    {recommendations.length > 0 ? (
      <div className="recommendations-grid">
        {recommendations.map(rec => (
          <div key={rec._id} className="recommendation-card">
            <h3>{rec.title}</h3>
            <p>by {rec.author}</p>
            <p>{rec.description}</p>
            <StarRating rating={rec.rating} readOnly />
            <SocialActions
              targetType="recommendation"
              targetId={rec._id}
              initialLikeCount={rec.likeCount}
              initialCommentCount={rec.commentCount}
              initialShareCount={rec.shareCount}
            />
          </div>
        ))}
      </div>
    ) : (
      <div className="no-content">No recommendations found</div>
    )}
  </div>
);

const LikedBooksTab = ({ likedBooks }) => (
  <div className="liked-books-tab">
    {likedBooks.length > 0 ? (
      <div className="liked-books-grid">
        {likedBooks.map(like => (
          <div key={like._id} className="liked-book-card">
            <h3>{like.recommendationId?.title || 'Unknown Book'}</h3>
            <p>by {like.recommendationId?.author || 'Unknown Author'}</p>
            <small>Liked on {new Date(like.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    ) : (
      <div className="no-content">No liked books found</div>
    )}
  </div>
);

const CommentsTab = ({ comments }) => (
  <div className="comments-tab">
    {comments.length > 0 ? (
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment._id} className="comment-card">
            <p>{comment.text}</p>
            <small>On {comment.recommendationId?.title || 'Unknown'} • {new Date(comment.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    ) : (
      <div className="no-content">No comments found</div>
    )}
  </div>
);

const FollowersTab = ({ followers }) => (
  <div className="followers-tab">
    {followers.length > 0 ? (
      <div className="users-grid">
        {followers.map(follow => (
          <div key={follow._id} className="user-card">
            <div className="user-avatar">
              {follow.follower.profilePicture ? (
                <img src={follow.follower.profilePicture} alt={follow.follower.name} />
              ) : (
                <div className="avatar-placeholder">
                  {follow.follower.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h4>{follow.follower.name}</h4>
            {follow.follower.bio && <p>{follow.follower.bio}</p>}
          </div>
        ))}
      </div>
    ) : (
      <div className="no-content">No followers found</div>
    )}
  </div>
);

const FollowingTab = ({ following }) => (
  <div className="following-tab">
    {following.length > 0 ? (
      <div className="users-grid">
        {following.map(follow => (
          <div key={follow._id} className="user-card">
            <div className="user-avatar">
              {follow.following.profilePicture ? (
                <img src={follow.following.profilePicture} alt={follow.following.name} />
              ) : (
                <div className="avatar-placeholder">
                  {follow.following.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h4>{follow.following.name}</h4>
            {follow.following.bio && <p>{follow.following.bio}</p>}
          </div>
        ))}
      </div>
    ) : (
      <div className="no-content">Not following anyone yet</div>
    )}
  </div>
);

export default UserProfile;
