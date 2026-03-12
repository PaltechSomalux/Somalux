import React, { useState, useEffect } from 'react';
import { FiStar, FiEye, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import { useAdminUI } from '../../AdminUIContext';
import './RentalsAdmin.css';

export const ReviewsModeration = ({ userProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const { prompt, showToast } = useAdminUI();

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/reviews?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || '';
    if (!token) console.warn('No Supabase session token found');
    return token;
  };

  const handleApprove = async (reviewId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Review approved.' });
        loadReviews();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to approve review.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to approve review.' });
    }
  };

  const handleHide = async (reviewId) => {
    const reason = await prompt({
      title: 'Hide review',
      message: 'Provide a reason for hiding this review.',
      label: 'Reason',
      multiline: true,
      confirmLabel: 'Hide',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!reason || reason.trim() === '') return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/reviews/${reviewId}/hide`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Review hidden.' });
        loadReviews();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to hide review.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to hide review.' });
    }
  };

  return (
    <div className="reviews-moderation">
      <div className="page-header">
        <h1>Reviews Moderation</h1>
        <p>Review and moderate student reviews</p>
      </div>

      {/* Filters */}
      <div className="filter-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'visible' ? 'active' : ''} onClick={() => setFilter('visible')}>Visible</button>
        <button className={filter === 'hidden' ? 'active' : ''} onClick={() => setFilter('hidden')}>Hidden</button>
        <button className={filter === 'flagged' ? 'active' : ''} onClick={() => setFilter('flagged')}>Flagged</button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="table-loading">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <FiStar size={64} />
          <h3>No reviews found</h3>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className={`review-card ${!review.is_visible ? 'hidden' : ''}`}>
              <div className="review-header">
                <div className="review-rating">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={16}
                      fill={i < review.rating ? '#ffc107' : 'none'}
                      color="#ffc107"
                    />
                  ))}
                  <span className="rating-value">{review.rating}/5</span>
                </div>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="review-property">
                <strong>{review.rental_listings?.title}</strong>
                <span className="text-muted">{review.rental_listings?.area_name}</span>
              </div>

              {review.title && <h4 className="review-title">{review.title}</h4>}
              
              <p className="review-comment">{review.comment}</p>

              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((img, i) => (
                    <img key={i} src={img} alt="Review" />
                  ))}
                </div>
              )}

              <div className="review-footer">
                <div className="review-stats">
                  <span>👍 {review.helpful_count} helpful</span>
                  {review.is_verified && (
                    <span className="verified-badge">✓ Verified Booking</span>
                  )}
                </div>

                <div className="review-actions">
                  {review.is_visible ? (
                    <button
                      className="btn-sm danger"
                      onClick={() => handleHide(review.id)}
                    >
                      <FiXCircle /> Hide
                    </button>
                  ) : (
                    <button
                      className="btn-sm success"
                      onClick={() => handleApprove(review.id)}
                    >
                      <FiCheckCircle /> Show
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsModeration;
