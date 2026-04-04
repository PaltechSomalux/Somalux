import React, { useState } from 'react';
import {
  FaUserEdit,
  FaHeart,
  FaRegHeart,
  FaThumbsUp,
  FaRegThumbsUp,
  FaBookOpen,
  FaTwitter,
  FaFacebook,
  FaInstagram
} from 'react-icons/fa';
import './Authors.css';

export const AuthorCard = ({
  author,
  isFollowing,
  showSocialOptions,
  onAuthorClick,
  onToggleFollow,
  onToggleSocialOptions,
  onFollowSocial,
  onToggleLike,
  onToggleLove,
  onImageError,
  userRating,
  onRating,
  hoverRating,
  onHoverRating
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Generate a unique color based on author name
  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6C5CE7', '#A29BFE', '#FF7675', '#F0A500', '#00C9A7'];
    return colors[Math.abs(hash % colors.length)];
  };

  const authorInitials = author.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="author-card" onClick={() => onAuthorClick(author)}>
      <div className="author-photo">
        {author.photo && !imageError ? (
          <>
            <img
              src={author.photo}
              alt={author.name}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                display: imageLoaded ? 'block' : 'none',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--primary)',
                boxShadow: '0 4px 12px rgba(0, 168, 132, 0.3)'
              }}
            />
            {!imageLoaded && (
              <div 
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#1f2c33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9em',
                  color: '#8696a0',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 12px rgba(0, 168, 132, 0.3)'
                }}
              >
                Loading...
              </div>
            )}
          </>
        ) : imageError || !author.photo ? (
          <div 
            style={{
              display: 'flex',
              backgroundColor: getAvatarColor(author.name),
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3em',
              fontWeight: 'bold',
              color: 'white',
              border: '3px solid var(--primary)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            {authorInitials}
          </div>
        ) : null}

        <div className="author-badge">
          <FaBookOpen /> {author.booksPublished} books
        </div>
      </div>

      <div className="author-info">
        <h3>{author.name}</h3>
        <p className="nationality">{author.nationality}</p>
        <div className="rating-stars">
          {[...Array(5)].map((_, i) => (
            <span 
              key={i} 
              className={`${i < Math.floor(author.displayRating) ? 'filled' : ''} ${i < (hoverRating || userRating || 0) ? 'user-rated' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onRating) onRating(author.id, i + 1);
              }}
              onMouseEnter={() => onHoverRating?.(i + 1)}
              onMouseLeave={() => onHoverRating?.(0)}
              style={{ cursor: 'pointer', fontSize: '1.2em' }}
              title={`Rate ${i + 1} star${i !== 0 ? 's' : ''}`}
            >
              ★
            </span>
          ))}
          <span>
            ({userRating ? `You rated: ${userRating}★` : (author.displayRating > 0 ? `Avg: ${author.displayRating.toFixed(1)}★` : 'Not rated')})
          </span>
        </div>
        <div className="author-stats-inline">
          <span title="Followers">{author.followers || 0} followers</span>
        </div>
        <div className="author-actions">
          <div className="follow-container">
            <button
              className={`follow-button ${isFollowing ? 'following' : ''}`}
              onClick={(e) => onToggleFollow(author.id, e)}
            >
              <FaUserEdit /> {isFollowing ? 'Following' : 'Follow'}
            </button>
            {isFollowing && (
              <button
                className="social-button"
                onClick={(e) => onToggleSocialOptions(author.id, e)}
                title="Follow on social media"
              >
                +
              </button>
            )}
            {showSocialOptions === author.id && (
              <div className="social-options">
                <button onClick={(e) => onFollowSocial(author.id, 'twitter', e)}>
                  <FaTwitter /> X.com
                </button>
                <button onClick={(e) => onFollowSocial(author.id, 'facebook', e)}>
                  <FaFacebook /> Facebook
                </button>
                <button onClick={(e) => onFollowSocial(author.id, 'instagram', e)}>
                  <FaInstagram /> Instagram
                </button>
              </div>
            )}
          </div>
          <div className="reaction-buttons">
            <button
              className={`like-button ${author.isLiked ? 'active' : ''}`}
              onClick={(e) => onToggleLike(author.id, e)}
              title="Like this author"
            >
              {author.isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />}
              <span className="count">{author.likes}</span>
            </button>
            <button
              className={`love-button ${author.isLoved ? 'active' : ''}`}
              onClick={(e) => onToggleLove(author.id, e)}
              title="Love this author"
            >
              {author.isLoved ? <FaHeart color="red" /> : <FaRegHeart />}
              <span className="count">{author.loves}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};