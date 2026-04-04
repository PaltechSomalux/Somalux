import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaHeart,
  FaThumbsUp,
  FaBookOpen,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import './Authors.css';

export const AuthorModal = ({
  author,
  authorBooks,
  externalBooks,
  showAllBooks,
  showAllExternal,
  modalCoverLoading,
  userRating,
  hoverRating,
  onClose,
  onImageError,
  onRating,
  onHoverRating,
  onToggleShowAllBooks,
  onToggleShowAllExternal
}) => {
  const navigate = useNavigate();

  if (!author) return null;

  return (
    <div className="author-spotlight">
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>×</button>

        {/* Header */}
        <div className="author-header">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={author.photo}
              alt={author.name}
              onError={(e) => onImageError(e, author, { allowDbLookup: true })}
            />
            {modalCoverLoading && (
              <div className="img-spinner" aria-hidden>
                <div className="spinner" />
              </div>
            )}
          </div>

          <div className="author-info">
            <h2>{author.name}</h2>

            <div className="author-stats">
              <span><FaBookOpen /> {author.booksPublished} books</span>
              <span><FaThumbsUp /> {author.likes || 0} likes</span>
              <span><FaHeart /> {author.loves || 0} loves</span>
              <span><FaUsers /> {author.followers || 0} followers</span>
            </div>

            <div className="author-rating-display">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={i < Math.floor(author.displayRating || author.averageRating || 0) ? 'filled' : ''}
                  >
                    ★
                  </span>
                ))}
                <span>
                  {author.averageRating > 0
                    ? `${author.averageRating.toFixed(1)} (${author.ratingCount} ${author.ratingCount === 1 ? 'rating' : 'ratings'})`
                    : 'Not rated yet'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="author-details">
          <h3>About {author.name}</h3>
          <p>{author.biography || 'No bio added.'}</p>

          {/* User Rating */}
          <div className="rating-section">
            <h3>Rate This Author</h3>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onMouseEnter={() => onHoverRating(star)}
                  onMouseLeave={() => onHoverRating(0)}
                  onClick={() => onRating(author.id, star)}
                  className={`star ${(hoverRating || userRating || 0) >= star ? 'filled' : ''}`}
                >
                  {(hoverRating || userRating || 0) >= star ? <FaStar /> : <FaRegStar />}
                </span>
              ))}
              <span className="rating-text">
                {userRating
                  ? `You rated this author ${userRating} star${userRating > 1 ? 's' : ''}`
                  : 'Click to rate this author'}
              </span>
            </div>
          </div>

          {/* Books in System */}
          <div className="author-books-section" onClick={(e) => e.stopPropagation()}>
            <h3>Books available</h3>

            {authorBooks.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>
                No books by this author are available in the system.
              </p>
            ) : (
              <ul className="author-book-list">
                {(showAllBooks ? authorBooks : authorBooks.slice(0, 5)).map(b => (
                  <li key={b.id} className="author-book-item">
                    <img
                      src={b.cover_url || author.photo || `https://via.placeholder.com/64x88?text=No+Cover`}
                      alt={b.title}
                      className="book-thumb"
                    />
                    <button
                      className="book-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/BookManagement?book=${encodeURIComponent(b.id)}`);
                        onClose();
                      }}
                    >
                      {b.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {authorBooks.length > 5 && (
              <button
                className="more-books"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShowAllBooks();
                }}
              >
                {showAllBooks ? 'Show less' : `More books (${authorBooks.length - 5} more)`}
              </button>
            )}
          </div>

          {/* External Books */}
          <div className="author-books-section external-books-section" onClick={(e) => e.stopPropagation()}>
            <h3>Other books</h3>

            {externalBooks.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>
                No additional books found from external sources.
              </p>
            ) : (
              <ul className="author-book-list external-book-list">
                {(showAllExternal ? externalBooks : externalBooks.slice(0, 5)).map(b => (
                  <li key={b.id} className="author-book-item external-book-item">
                    <img
                      src={b.thumbnail || author.photo || `https://via.placeholder.com/64x88?text=No+Cover`}
                      alt={b.title}
                      className="book-thumb"
                    />
                    <a
                      className="book-link"
                      href={b.infoLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {b.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {externalBooks.length > 5 && (
              <button
                className="more-books"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShowAllExternal();
                }}
              >
                {showAllExternal ? 'Show less' : `More books (${externalBooks.length - 5} more)`}
              </button>
            )}
          </div>

          {/* Social Links */}
          <div className="author-socials" style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
            <h4>Find {author.name} online</h4>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <a
                className="social-btn"
                href={`https://twitter.com/search?q=${encodeURIComponent(author.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ color: '#1DA1F2' }}><FaTwitter /></span> Twitter
              </a>

              <a
                className="social-btn"
                href={`https://www.facebook.com/search/top?q=${encodeURIComponent(author.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ color: '#1877F2' }}><FaFacebook /></span> Facebook
              </a>

              <a
                className="social-btn"
                href={`https://www.instagram.com/${encodeURIComponent(author.name.replace(/\s+/g, ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ color: '#E1306C' }}><FaInstagram /></span> Instagram
              </a>

              <a
                className="social-btn"
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(author.name.replace(/\s+/g, '_'))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Wikipedia
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
