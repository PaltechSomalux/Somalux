import './JobCard.css';
import { useState, useRef } from 'react';
import { FaBriefcase, FaScaleBalanced } from 'react-icons/fa6';

/**
 * Highlights matching search terms by changing text color only
 */
const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const searchLower = searchTerm.toLowerCase().trim();
  const textStr = String(text);
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
  
  if (searchWords.length === 0) return text;
  
  // Create a pattern that matches whole words
  const pattern = searchWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  const parts = [];
  let lastIdx = 0;
  let match;
  
  // Find all matches and create highlighted elements
  while ((match = regex.exec(textStr)) !== null) {
    // Add text before the match
    if (match.index > lastIdx) {
      parts.push(<span key={`text-${lastIdx}`}>{textStr.substring(lastIdx, match.index)}</span>);
    }
    // Add the colored match (no background highlight)
    parts.push(<span key={`highlight-${match.index}`} style={{color: '#FFD700', fontWeight: '600'}}>{match[0]}</span>);
    lastIdx = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIdx < textStr.length) {
    parts.push(<span key={`text-end`}>{textStr.substring(lastIdx)}</span>);
  }
  
  return parts.length > 0 ? parts : text;
};

/**
 * Formats numbers to K format (1000+ becomes 1K, 1500 becomes 1.5K, etc.)
 */
const formatNumberToK = (num) => {
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
  }
  return num.toString();
};

function JobCard({ job, searchTerm = '', onSelect, style, onToggleLiked, likedItems, onToggleBookmarked, bookmarkedItems, onToggleFollowing, followingItems, isUserProfile = false }) {
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 2000) + 100);
  const [views] = useState(Math.floor(Math.random() * 500) + 50);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);

  // Determine if this card is liked/bookmarked/following from global state
  const isLiked = likedItems?.[job.id] || false;
  const isBookmarked = bookmarkedItems?.[job.id] || false;

  const handleLike = () => {
    // Call the global toggle function
    if (onToggleLiked) {
      onToggleLiked(job.id);
    }
    // Update local like count
    if (!isLiked) {
      setLikeCount(likeCount + 1);
    } else {
      setLikeCount(likeCount - 1);
    }
  };

  const createBubble = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const bubble = document.createElement('span');
    bubble.className = 'love-bubble';
    bubble.innerHTML = '❤️';
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    bubble.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
    
    card.appendChild(bubble);

    setTimeout(() => {
      bubble.remove();
    }, 1200);
  };

  const handleCardClick = (e) => {
    createBubble(e);
    onSelect();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`job-card ${isUserProfile ? 'user-profile-card' : ''}`} onClick={handleCardClick} ref={cardRef} style={style}>
      {isUserProfile && <div className="you-badge">You</div>}
      <div className="card-top">
        <div className="user-section">
          <div className="avatar-container">
            {job.avatar && !imageError ? (
              <img src={job.avatar} alt={job.name} className="avatar" onError={handleImageError} />
            ) : (
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="avatar-placeholder">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <div className="user-content">
            <h3>{searchTerm ? highlightText(job.name, searchTerm) : job.name}</h3>
            <div className="title-rating-row">
              <h4 className="job-title">{searchTerm ? highlightText(job.title, searchTerm) : job.title}</h4>
            </div>
            <div className="rating">
              <span>⭐ {job.rating}</span>
            </div>
          </div>
        </div>
        <p className="about-text">{searchTerm ? highlightText(job.bio, searchTerm) : job.bio}</p>
      </div>

      <div className="card-body">
        {job.skills && job.skills.length > 0 && (
          <div className="card-skills-section">
            <div className="card-skills-value">
              {job.skills.slice(0, 4).map((skill, index) => (
                <span key={index}>
                  {index > 0 && <span className="card-skill-separator">|</span>}
                  <span className="card-skill-item">{skill}</span>
                </span>
              ))}
              {job.skills.length > 4 && (
                <>
                  <span className="card-skill-separator">|</span>
                  <span className="card-skill-item">+{job.skills.length - 4} more</span>
                </>
              )}
            </div>
          </div>
        )}
        <div className="card-info-row">
          {job.location && (
            <div className="card-info-item">
              <svg className="card-info-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 7 10 13 10 13s10-6 10-13c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              <span className="card-info-value">
                {job.location.split(',').length > 1 
                  ? job.location.split(',').map(l => l.trim()).reverse().join(' • ')
                  : job.location
                }
              </span>
            </div>
          )}
        </div>
        <div className="location-distance-wrapper">
          {job.distance && (
            <div className="distance-section">
              <svg className="distance-icon" width="10" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 7 10 13 10 13s10-6 10-13c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              <span className="distance-label">{job.distance} away</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        <div className="footer-item">
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            title="Like"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <span className="like-count">{formatNumberToK(likeCount)}</span>
        </div>
        <span className="views-count">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', marginRight: '4px', verticalAlign: 'middle'}}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          {formatNumberToK(views)}
        </span>
        <button 
          className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleBookmarked) {
              onToggleBookmarked(job.id);
            }
          }}
          title="Bookmark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default JobCard;
