import React from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';

export const ReviewModal = ({
  product,
  setShowReviewModal,
  setSelectedProductForReview,
  reviewData,
  setReviewData,
  handleSubmitReview
}) => {
  return (
    <div className="modal-overlay" onClick={() => {
      setShowReviewModal(false);
      setSelectedProductForReview(null);
    }}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Write a Review</h2>
          <button className="close-modal" onClick={() => {
            setShowReviewModal(false);
            setSelectedProductForReview(null);
          }}>
            <FaTimes />
          </button>
        </div>
        
        <div className="review-product">
          <img src={product.images[0]} alt="" />
          <h3>{product.title}</h3>
        </div>
        
        <div className="review-rating">
          <label>Your Rating</label>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar 
                key={star}
                className={star <= reviewData.rating ? 'filled' : 'empty'}
                onClick={() => setReviewData({...reviewData, rating: star})}
              />
            ))}
          </div>
          <span className="rating-text">
            {reviewData.rating === 1 && 'Poor'}
            {reviewData.rating === 2 && 'Fair'}
            {reviewData.rating === 3 && 'Good'}
            {reviewData.rating === 4 && 'Very Good'}
            {reviewData.rating === 5 && 'Excellent'}
          </span>
        </div>
        
        <div className="form-group">
          <label>Review Title</label>
          <input 
            type="text" 
            placeholder="Summarize your experience"
            value={reviewData.title}
            onChange={(e) => setReviewData({...reviewData, title: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Your Review</label>
          <textarea 
            placeholder="Share details about your experience with this product"
            value={reviewData.comment}
            onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
          ></textarea>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              checked={reviewData.anonymous}
              onChange={(e) => setReviewData({...reviewData, anonymous: e.target.checked})}
            />
            <span className="checkmark"></span>
            Post anonymously
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => {
              setShowReviewModal(false);
              setSelectedProductForReview(null);
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="submit-button"
            onClick={handleSubmitReview}
            disabled={!reviewData.title || !reviewData.comment}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

