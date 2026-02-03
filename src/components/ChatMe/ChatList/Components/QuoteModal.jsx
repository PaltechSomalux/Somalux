// src/KissMe/Components/QuoteModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiX, FiPlay, FiMic, FiFile, FiBarChart2, FiType } from 'react-icons/fi';
import { MediaCarousel } from './MediaCarousel';
import { getRelativeTime } from './Utils';
import './MediaPanel.css';

const showToast = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

export const QuoteModal = ({ isOpen, onClose, media, currentUser, onSubmit }) => {
  const [quoteText, setQuoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quoteText.trim()) {
      showToast('Quote cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        text: quoteText,
        quotedMedia: media,
        type: 'quote',
      });
      setQuoteText('');
      onClose();
      showToast('Quote posted successfully', 'success');
    } catch (error) {
      console.error('Failed to submit quote post:', error);
      showToast('Failed to submit quote post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const previewMedia = media.mediaItems && media.mediaItems.length > 0 ? media.mediaItems[0] : media;

  return (
    <motion.div
      className="quote-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="quote-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quote-modal-header">
          <h3>Quote Post</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quote-form">
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="Add a comment..."
            className="quote-textarea"
            maxLength={280}
            autoFocus
          />

          <div className="quoted-media-preview">
            <div className="quoted-media-header">
              <span className="quoted-user">@{media.user}</span>
              <span className="quoted-time">{getRelativeTime(media.uploadDate)}</span>
            </div>

            <div className="quoted-content">
              {(media.content || media.description) && (
                <p>{media.content || media.description}</p>
              )}

              {media.mediaItems && media.mediaItems.length > 0 ? (
                <MediaCarousel mediaItems={media.mediaItems} />
              ) : previewMedia.mediaType === 'photo' ? (
                <img
                  src={previewMedia.mediaUrl}
                  alt={previewMedia.caption}
                  className="quoted-media-thumb"
                  width={previewMedia.width}
                  height={previewMedia.height}
                />
              ) : previewMedia.mediaType === 'video' ? (
                <div className="quoted-video-thumb">
                  <video
                    src={previewMedia.mediaUrl}
                    className="quoted-media-thumb"
                    muted
                    width={previewMedia.width}
                    height={previewMedia.height}
                  />
                  <FiPlay className="play-overlay" />
                </div>
              ) : previewMedia.mediaType === 'poll' ? (
                <div className="quoted-media-poll">
                  <FiBarChart2 size={24} />
                  <p>{previewMedia.caption}</p>
                </div>
              ) : previewMedia.mediaType === 'text' ? (
                <div className="quoted-media-text">
                  <FiType size={24} />
                  <p>{previewMedia.content}</p>
                </div>
              ) : null}
            </div>

            <div className="quote-modal-footer">
              <span className="char-count">{quoteText.length}/280</span>
              <div className="quote-actions">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!quoteText.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Quote Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

QuoteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  media: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.string,
    uploadDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    content: PropTypes.string,
    description: PropTypes.string,
    mediaItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        mediaUrl: PropTypes.string,
        mediaType: PropTypes.string,
        caption: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
      })
    ),
    mediaType: PropTypes.string,
    mediaUrl: PropTypes.string,
    caption: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
  currentUser: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
};