import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar } from 'react-icons/fi';
import './RatingModal.css';

export const RatingModal = ({ isOpen, onClose, book, onRate, existingRating = null }) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(existingRating || 0);
  const [submitting, setSubmitting] = useState(false);
  const hasRated = existingRating !== null && existingRating > 0;

  const handleRate = async () => {
    if (selectedRating === 0) return;
    
    setSubmitting(true);
    try {
      await onRate(selectedRating);
      setTimeout(onClose, 500); // Close after brief delay
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if no book is provided
  if (!book) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="rating-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="rating-modal-content"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="rating-modal-close" onClick={onClose}>
              <FiX size={20} />
            </button>

            <div className="rating-modal-header">
              <h3>{hasRated ? 'Your Rating' : 'How would you rate this book?'}</h3>
              <p className="rating-book-title">{book.title}</p>
              {hasRated && (
                <p className="rating-already-rated">✓ You've already rated this book</p>
              )}
            </div>

            <div className="rating-stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rating-star ${star <= (hoveredStar || selectedRating) ? 'active' : ''} ${hasRated ? 'disabled' : ''}`}
                  onMouseEnter={() => !hasRated && setHoveredStar(star)}
                  onMouseLeave={() => !hasRated && setHoveredStar(0)}
                  onClick={() => !hasRated && setSelectedRating(star)}
                  disabled={submitting || hasRated}
                >
                  <FiStar 
                    size={40} 
                    fill={star <= (hoveredStar || selectedRating) ? '#fbbf24' : 'none'}
                    color={star <= (hoveredStar || selectedRating) ? '#fbbf24' : '#9ca3af'}
                  />
                </button>
              ))}
            </div>

            <div className="rating-label">
              {selectedRating === 0 && 'Click a star to rate'}
              {selectedRating === 1 && '⭐ Poor'}
              {selectedRating === 2 && '⭐⭐ Fair'}
              {selectedRating === 3 && '⭐⭐⭐ Good'}
              {selectedRating === 4 && '⭐⭐⭐⭐ Very Good'}
              {selectedRating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
            </div>

            <div className="rating-actions">
              <button 
                className="btn-secondary" 
                onClick={onClose}
                disabled={submitting}
              >
                Maybe Later
              </button>
              <button 
                className="btn-primary" 
                onClick={handleRate}
                disabled={selectedRating === 0 || submitting || hasRated}
              >
                {submitting ? 'Submitting...' : hasRated ? 'Already Rated' : 'Submit Rating'}
              </button>
            </div>

            <p className="rating-helper-text">
              {hasRated ? 'Thank you for your rating!' : 'Your rating helps others discover great books!'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
