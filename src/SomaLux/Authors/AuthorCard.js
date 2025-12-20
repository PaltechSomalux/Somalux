import React from 'react';
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
  return (
    <div className="author-card" onClick={() => onAuthorClick(author)}>
      <div className="author-photo">
        <img
          src={author.photo}
          alt={author.name}
          onError={(e) => onImageError(e, author, { allowDbLookup: false })}
        />
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