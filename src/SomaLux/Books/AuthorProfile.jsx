import React, { useEffect, useState } from 'react';
import { FiBook, FiDownload, FiStar, FiHeart, FiUsers, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { MdFavoriteBorder } from 'react-icons/md';
import {
  toggleAuthorFollow,
  toggleAuthorLike,
  toggleAuthorLove,
  getAuthorRatings,
  getAuthorComments,
  getAuthorEngagementStats,
  getUserAuthorInteractionStatus,
  rateAuthor,
  addAuthorComment,
  recordAuthorShare
} from '../Admin/authorInteractionsApi';
import { supabase } from '../supabaseClient';
import './AuthorProfile.css';

const AuthorProfile = ({ authorName, currentUserId }) => {
  const [author, setAuthor] = useState(null);
  const [stats, setStats] = useState(null);
  const [interactions, setInteractions] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newRating, setNewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAuthorData();
  }, [authorName, currentUserId]);

  const loadAuthorData = async () => {
    try {
      setLoading(true);
      
      // Fetch author books
      // Note: We don't filter by author here to avoid encoding issues with special characters
      // Instead, we'll filter in JavaScript after fetching
      const { data: allBooks, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'published');
      
      // Filter books by author in JavaScript (case-insensitive)
      const books = (allBooks || []).filter(b => 
        (b.author || '').toLowerCase() === (authorName || '').toLowerCase()
      );

      if (booksError) throw booksError;

      // Fetch engagement stats
      const engageStats = await getAuthorEngagementStats(authorName);

      // Fetch user interactions if logged in
      let userInteractions = null;
      if (currentUserId) {
        userInteractions = await getUserAuthorInteractionStatus(authorName, currentUserId);
      }

      // Fetch ratings and comments
      const [authorRatings, authorComments] = await Promise.all([
        getAuthorRatings(authorName),
        getAuthorComments(authorName)
      ]);

      setAuthor({
        name: authorName,
        books: books || [],
        booksCount: books?.length || 0
      });
      setStats(engageStats);
      setInteractions(userInteractions);
      setRatings(authorRatings || []);
      setComments(authorComments || []);
    } catch (error) {
      console.error('Error loading author data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      alert('Please log in to follow authors');
      return;
    }

    try {
      setSubmitting(true);
      await toggleAuthorFollow(authorName, currentUserId);
      await loadAuthorData();
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUserId) {
      alert('Please log in to like authors');
      return;
    }

    try {
      setSubmitting(true);
      await toggleAuthorLike(authorName, currentUserId);
      await loadAuthorData();
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLove = async () => {
    if (!currentUserId) {
      alert('Please log in to love authors');
      return;
    }

    try {
      setSubmitting(true);
      await toggleAuthorLove(authorName, currentUserId);
      await loadAuthorData();
    } catch (error) {
      console.error('Error toggling love:', error);
      alert('Failed to update love status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!currentUserId) {
      alert('Please log in to rate authors');
      return;
    }

    if (newRating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await rateAuthor(authorName, currentUserId, newRating, reviewText);
      setNewRating(0);
      setReviewText('');
      await loadAuthorData();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      alert('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      await addAuthorComment(authorName, currentUserId, commentText);
      setCommentText('');
      await loadAuthorData();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await recordAuthorShare(authorName, currentUserId || null, 'share');
      
      if (navigator.share) {
        await navigator.share({
          title: `${authorName} on SomaLux`,
          text: `Check out ${authorName} on SomaLux!`,
          url: window.location.href
        });
      } else {
        alert('Author profile shared!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="author-profile">
        <div className="author-loading">
          <div className="author-spinner"></div>
          <p>Loading author profile...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="author-profile">
        <div className="author-error">
          <p>Author not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="author-profile">
      {/* Author Header */}
      <div className="author-header">
        <div className="author-header-content">
          <h1 className="author-name">{author.name}</h1>
          <div className="author-stats-bar">
            <div className="author-stat">
              <FiBook /> {author.booksCount} Books
            </div>
            <div className="author-stat">
              <FiDownload /> {stats?.total_downloads || 0} Downloads
            </div>
            <div className="author-stat">
              <FiUsers /> {stats?.followers_count || 0} Followers
            </div>
            <div className="author-stat">
              <FiStar /> {stats?.rating || 0}/5
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="author-actions">
        <button
          className={`author-action-btn ${interactions?.isFollower ? 'active' : ''}`}
          onClick={handleToggleFollow}
          disabled={submitting}
        >
          <FiUsers /> {interactions?.isFollower ? 'Following' : 'Follow'}
        </button>
        <button
          className={`author-action-btn ${interactions?.hasLiked ? 'active' : ''}`}
          onClick={handleToggleLike}
          disabled={submitting}
        >
          <MdFavoriteBorder /> Like ({stats?.likes_count || 0})
        </button>
        <button
          className={`author-action-btn ${interactions?.hasLoved ? 'active' : ''}`}
          onClick={handleToggleLove}
          disabled={submitting}
        >
          <FiHeart /> Love ({stats?.loves_count || 0})
        </button>
        <button className="author-action-btn" onClick={handleShare}>
          <FiShare2 /> Share
        </button>
      </div>

      {/* Tabs */}
      <div className="author-tabs">
        <button
          className={`author-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`author-tab ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          Books ({author.booksCount})
        </button>
        <button
          className={`author-tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          Ratings ({ratings.length})
        </button>
        <button
          className={`author-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments ({comments.length})
        </button>
      </div>

      {/* Content */}
      <div className="author-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="author-overview">
            <div className="author-stats-grid">
              <div className="author-stat-card">
                <FiBook /> <strong>Books</strong> {author.booksCount}
              </div>
              <div className="author-stat-card">
                <FiDownload /> <strong>Downloads</strong> {stats?.total_downloads || 0}
              </div>
              <div className="author-stat-card">
                <FiUsers /> <strong>Followers</strong> {stats?.followers_count || 0}
              </div>
              <div className="author-stat-card">
                <MdFavoriteBorder /> <strong>Likes</strong> {stats?.likes_count || 0}
              </div>
              <div className="author-stat-card">
                <FiHeart /> <strong>Loves</strong> {stats?.loves_count || 0}
              </div>
              <div className="author-stat-card">
                <FiMessageSquare /> <strong>Comments</strong> {stats?.comments_count || 0}
              </div>
            </div>

            {/* Rating Section */}
            <div className="author-rating-section">
              <h3>Rate This Author</h3>
              <div className="author-rating-input">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`rating-star ${newRating >= star ? 'filled' : ''}`}
                      onClick={() => setNewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {newRating > 0 && <span className="rating-text">{newRating}/5</span>}
              </div>
              <textarea
                placeholder="Share your thoughts about this author..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="author-review-input"
                rows="3"
              />
              <button
                onClick={handleSubmitRating}
                disabled={submitting || newRating === 0}
                className="author-submit-btn"
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div className="author-books">
            <div className="books-grid">
              {author.books.length > 0 ? (
                author.books.map(book => (
                  <div key={book.id} className="book-card">
                    {book.cover_url && (
                      <img src={book.cover_image_url} alt={book.title} className="book-cover" />
                    )}
                    <h4 className="book-title">{book.title}</h4>
                    <p className="book-meta">
                      {book.downloads_count} downloads · {book.rating}/5
                    </p>
                  </div>
                ))
              ) : (
                <p>No books available</p>
              )}
            </div>
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="author-ratings">
            {ratings.length > 0 ? (
              <div className="ratings-list">
                {ratings.map(rating => (
                  <div key={rating.id} className="rating-item">
                    <div className="rating-header">
                      <strong>{rating.profiles?.username}</strong>
                      <span className="rating-stars-display">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < rating.rating ? 'filled' : ''}>★</span>
                        ))}
                      </span>
                    </div>
                    {rating.review && <p className="rating-review">{rating.review}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p>No ratings yet. Be the first to rate!</p>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="author-comments">
            <div className="comment-input-section">
              <textarea
                placeholder="Share your thoughts about this author..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="author-comment-input"
                rows="3"
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !commentText.trim()}
                className="author-submit-btn"
              >
                Post Comment
              </button>
            </div>

            {comments.length > 0 ? (
              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{comment.profiles?.username}</strong>
                      <span className="comment-date">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments yet. Be the first to comment!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorProfile;
