import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  FiEye,
  FiX,
  FiDownload,
  FiMoreVertical,
  FiPlay,
  FiMessageSquare,
  FiMic,
  FiFile,
  FiBarChart2,
  FiType,
  FiBookmark,
  FiShare2,
  FiEdit3,
  FiRepeat,
} from 'react-icons/fi';
import { FaHeart as FaFilledHeart, FaRegHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentsSection } from './CommentsSection';
import './MediaPanel.css';

const placeholderMediaData = [];

const getRelativeTime = (date) => {
  const now = new Date();
  const timestamp = new Date(date);
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

const QuoteModal = ({ isOpen, onClose, media, currentUser, onSubmit }) => {
  const [quoteText, setQuoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        text: quoteText,
        quotedMedia: media,
        type: 'quote'
      });
      setQuoteText('');
      onClose();
    } catch (error) {
      console.error('Failed to submit quote post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
              
              {media.mediaType === 'photo' && (
                <img
                  src={media.mediaUrl}
                  alt={media.caption}
                  className="quoted-media-thumb"
                  width={media.width}
                  height={media.height}
                />
              )}
              {media.mediaType === 'video' && (
                <div className="quoted-video-thumb">
                  <video
                    src={media.mediaUrl}
                    className="quoted-media-thumb"
                    muted
                    width={media.width}
                    height={media.height}
                  />
                  <FiPlay className="play-overlay" />
                </div>
              )}
            </div>
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
        </form>
      </motion.div>
    </motion.div>
  );
};

export const MediaPanel = ({
  demoMode = false,
  profileMedia,
  profileUser,
  currentUser = 'current_user',
  compactMode = false,
  onMediaSelect,
}) => {
  const [media, setMedia] = useState(() => {
    try {
      const saved = localStorage.getItem('persistedMedia');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load persisted media from localStorage:', error);
      return [];
    }
  });
  const [displayedMedia, setDisplayedMedia] = useState([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState(() => {
    try {
      const saved = localStorage.getItem('deletedMediaIds');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load deleted media IDs from localStorage:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteTargetMedia, setQuoteTargetMedia] = useState(null);
  const reactionsRef = useRef(null);
  const commentsRef = useRef(null);

  const [mediaLikes, setMediaLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaLikes');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media likes from localStorage:', error);
      return {};
    }
  });

  const [mediaBookmarks, setMediaBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaBookmarks');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media bookmarks from localStorage:', error);
      return {};
    }
  });

  const [mediaComments, setMediaComments] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaComments');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media comments from localStorage:', error);
      return {};
    }
  });

  const [commentLikes, setCommentLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('commentLikes');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load comment likes from localStorage:', error);
      return {};
    }
  });

  const [mediaReactions, setMediaReactions] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaReactions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media reactions from localStorage:', error);
      return {};
    }
  });

  const [mediaRetweets, setMediaRetweets] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaRetweets');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media retweets from localStorage:', error);
      return {};
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Processing media data...');
      let dataToUse = media.length > 0 ? media : (profileMedia || placeholderMediaData);
      const processedData = dataToUse
        .filter((item) => !deletedMediaIds.includes(item.id))
        .map((item) => ({
          ...item,
          user: profileUser || item.user,
          comments: Array.isArray(mediaComments[item.id])
            ? mediaComments[item.id]
            : Array.isArray(item.comments)
            ? item.comments
            : [],
          commentCount: item.commentCount !== undefined
            ? item.commentCount
            : Array.isArray(item.comments)
            ? item.comments.length
            : 0,
          description: item.description || '',
          content: item.content || '',
          pollOptions: item.pollOptions || [],
          width: item.width || 1920,
          height: item.height || 1080,
          quotePostCount: item.quotePostCount || 0,
          retweetCount: item.retweetCount || 0,
          isQuote: item.isQuote || false,
          originalPost: item.originalPost || null,
        }));

      console.log('Processed media:', processedData);
      setMedia(processedData);
      setDisplayedMedia(processedData);
      setLoading(false);

      try {
        localStorage.setItem('persistedMedia', JSON.stringify(processedData));
      } catch (error) {
        console.error('Failed to save media to localStorage:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [profileMedia, profileUser, mediaComments, deletedMediaIds]);

  useEffect(() => {
    try {
      localStorage.setItem('mediaComments', JSON.stringify(mediaComments));
      localStorage.setItem('commentLikes', JSON.stringify(commentLikes));
      localStorage.setItem('mediaLikes', JSON.stringify(mediaLikes));
      localStorage.setItem('mediaBookmarks', JSON.stringify(mediaBookmarks));
      localStorage.setItem('mediaReactions', JSON.stringify(mediaReactions));
      localStorage.setItem('mediaRetweets', JSON.stringify(mediaRetweets));
      localStorage.setItem('deletedMediaIds', JSON.stringify(deletedMediaIds));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [mediaComments, commentLikes, mediaLikes, mediaBookmarks, mediaReactions, mediaRetweets, deletedMediaIds]);

  const handleMediaSelect = (item) => {
    const mediaToSelect = item.mediaType === 'quote' && item.originalPost ? item.originalPost : item;
    setSelectedMedia(mediaToSelect);
    setShowComments(false);
    setOpenMenuId(null);
    if (onMediaSelect) {
      onMediaSelect(mediaToSelect);
    }
  };

  const closeFullScreen = () => {
    setSelectedMedia(null);
    setShowComments(false);
    setOpenMenuId(null);
  };

  const handleClickOutside = (e) => {
    if (
      reactionsRef.current &&
      !reactionsRef.current.contains(e.target) &&
      !commentsRef.current?.contains(e.target) &&
      !e.target.closest('.media-section') &&
      !e.target.closest('.close-button') &&
      !e.target.closest('.comment-section') &&
      !e.target.closest('.quote-modal')
    ) {
      closeFullScreen();
    }
  };

  const toggleLike = (mediaId) => {
    setMediaLikes((prev) => {
      const currentLikes = prev[mediaId] || 0;
      const isCurrentlyLiked = mediaReactions[mediaId]?.liked;
      const newLikes = isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1;

      return {
        ...prev,
        [mediaId]: newLikes,
      };
    });

    setMediaReactions((prev) => ({
      ...prev,
      [mediaId]: {
        ...prev[mediaId],
        liked: !prev[mediaId]?.liked,
      },
    }));
  };

  const toggleBookmark = (mediaId) => {
    setMediaBookmarks((prev) => ({
      ...prev,
      [mediaId]: !prev[mediaId],
    }));
  };

  const toggleRetweet = (mediaId) => {
    setMediaRetweets((prev) => {
      const currentRetweets = prev[mediaId]?.count || 0;
      const isCurrentlyRetweeted = prev[mediaId]?.retweeted;

      return {
        ...prev,
        [mediaId]: {
          count: isCurrentlyRetweeted ? currentRetweets - 1 : currentRetweets + 1,
          retweeted: !isCurrentlyRetweeted,
        },
      };
    });

    setMedia((prevMedia) => {
      const updatedMedia = prevMedia.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              retweetCount: isCurrentlyRetweeted(mediaId)
                ? (item.retweetCount || 0) - 1
                : (item.retweetCount || 0) + 1,
            }
          : item
      );
      try {
        localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
      } catch (error) {
        console.error('Failed to save media to localStorage:', error);
      }
      return updatedMedia;
    });

    setDisplayedMedia((prevMedia) =>
      prevMedia.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              retweetCount: isCurrentlyRetweeted(mediaId)
                ? (item.retweetCount || 0) - 1
                : (item.retweetCount || 0) + 1,
            }
          : item
      )
    );
  };

  const isCurrentlyRetweeted = (mediaId) => {
    return mediaRetweets[mediaId]?.retweeted || false;
  };

  const handleQuoteClick = (media) => {
    setQuoteTargetMedia(media);
    setShowQuoteModal(true);
  };

  const handleQuoteSubmit = async (quoteData) => {
    const newQuotePost = {
      id: `quote_${Date.now()}`,
      user: currentUser,
      userId: currentUser,
      uploadDate: new Date().toISOString(),
      mediaType: 'quote',
      content: '',
      description: quoteData.text,
      isQuote: true,
      originalPost: quoteData.quotedMedia,
      likes: 0,
      comments: [],
      commentCount: 0,
      quotePostCount: 0,
      retweetCount: 0,
      views: 0,
      width: quoteData.quotedMedia.width,
      height: quoteData.quotedMedia.height,
    };

    setMedia((prev) => {
      const updatedMedia = [newQuotePost, ...prev];
      try {
        localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
      } catch (error) {
        console.error('Failed to save media to localStorage:', error);
      }
      return updatedMedia;
    });

    setDisplayedMedia((prev) => [newQuotePost, ...prev]);

    const originalMediaId = quoteData.quotedMedia.id;
    setMedia((prevMedia) => {
      const updatedMedia = prevMedia.map((item) =>
        item.id === originalMediaId
          ? {
              ...item,
              quotePostCount: (item.quotePostCount || 0) + 1,
            }
          : item
      );
      try {
        localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
      } catch (error) {
        console.error('Failed to save media to localStorage:', error);
      }
      return updatedMedia;
    });

    setDisplayedMedia((prevMedia) =>
      prevMedia.map((item) =>
        item.id === originalMediaId
          ? {
              ...item,
              quotePostCount: (item.quotePostCount || 0) + 1,
            }
          : item
      )
    );

    setShowQuoteModal(false);
    setQuoteTargetMedia(null);
  };

  const handleShare = (media) => {
    try {
      let shareUrl = media.mediaType === 'poll' || media.mediaType === 'text' || media.mediaType === 'quote' ? window.location.href : media.mediaUrl;
      try {
        new URL(shareUrl);
      } catch {
        console.warn(`Invalid URL for share: ${shareUrl}, falling back to window.location.href`);
        shareUrl = window.location.href;
      }

      if (navigator.share) {
        navigator.share({
          title: media.caption || 'Media Content',
          text: media.caption || 'Check out this content!',
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  const handleDownload = async (media) => {
    if (media.mediaType === 'poll' || media.mediaType === 'text' || media.mediaType === 'quote') {
      alert('Download not available for this content type.');
      return;
    }

    try {
      const response = await fetch(media.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = {
        photo: 'jpg',
        video: 'mp4',
        audio: 'mp3',
        document: media.caption?.split('.').pop() || 'pdf',
      }[media.mediaType] || 'file';
      link.download = `${media.caption || 'media'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download media. Please try again.');
    }
  };

  const handleSubmitComment = async (commentData) => {
    if (!selectedMedia) return;

    try {
      setMediaComments((prev) => ({
        ...prev,
        [selectedMedia.id]: [
          ...(Array.isArray(prev[selectedMedia.id]) ? prev[selectedMedia.id] : []),
          commentData,
        ],
      }));

      setMedia((prevMedia) => {
        const updatedMedia = prevMedia.map((item) =>
          item.id === selectedMedia.id
            ? {
                ...item,
                comments: [
                  ...(Array.isArray(item.comments) ? item.comments : []),
                  commentData,
                ],
                commentCount: (item.commentCount || 0) + 1,
              }
            : item
        );
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (!selectedMedia) return;

    try {
      setMediaComments((prev) => ({
        ...prev,
        [selectedMedia.id]: (prev[selectedMedia.id] || []).filter(
          (c) => c.id !== commentId
        ),
      }));

      setMedia((prevMedia) => {
        const updatedMedia = prevMedia.map((item) =>
          item.id === selectedMedia.id
            ? {
                ...item,
                comments: (item.comments || []).filter((c) => c.id !== commentId),
                commentCount: Math.max((item.commentCount || 0) - 1, 0),
              }
            : item
        );
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });

      setCommentLikes((prevLikes) => {
        const updated = { ...prevLikes };
        delete updated[commentId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleLikeComment = (commentId) => {
    try {
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: !(prev[commentId] || false),
      }));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReplyToComment = (commentId, reply) => {
    if (!selectedMedia) return;

    try {
      setMediaComments((prev) => {
        const updatedComments = { ...prev };
        const comments = Array.isArray(prev[selectedMedia.id])
          ? prev[selectedMedia.id]
          : [];

        const updated = comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [
                ...(Array.isArray(comment.replies) ? comment.replies : []),
                reply,
              ],
            };
          }
          return comment;
        });

        updatedComments[selectedMedia.id] = updated;
        return updatedComments;
      });

      setMedia((prevMedia) => {
        const updatedMedia = prevMedia.map((item) =>
          item.id === selectedMedia.id
            ? {
                ...item,
                comments: (item.comments || []).map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        replies: [
                          ...(Array.isArray(comment.replies)
                            ? comment.replies
                            : []),
                          reply,
                        ],
                      }
                    : comment
                ),
              }
            : item
        );
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });
    } catch (error) {
      console.error('Failed to reply to comment:', error);
    }
  };

  const toggleMenu = (mediaId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === mediaId ? null : mediaId);
  };

  const handleDelete = (mediaId) => {
    try {
      console.log(`Deleting post with ID: ${mediaId}`);
      setDeletedMediaIds((prev) => {
        const updated = [...prev, mediaId];
        try {
          localStorage.setItem('deletedMediaIds', JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save deleted media IDs to localStorage:', error);
        }
        return updated;
      });

      setMedia((prev) => {
        const updatedMedia = prev.filter((item) => item.id !== mediaId);
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });

      setDisplayedMedia((prev) => prev.filter((item) => item.id !== mediaId));

      setMediaLikes((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaBookmarks((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaComments((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaReactions((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaRetweets((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(null);
        setShowComments(false);
      }

      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleReport = (mediaId) => {
    console.log(`Report post with ID: ${mediaId}`);
    setOpenMenuId(null);
  };

  const handleMute = (mediaId) => {
    console.log(`Mute user for post with ID: ${mediaId}`);
    setOpenMenuId(null);
  };

  const handleBlock = (mediaId) => {
    console.log(`Block user for post with ID: ${mediaId}`);
    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className={`grid ${compactMode ? 'compact-grid' : ''}`}>
        {[...Array(6)].map((_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-media"></div>
            <div className="skeleton-actions"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${compactMode ? 'compact-grid' : ''}`}>
        <AnimatePresence>
          {displayedMedia.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              layout
              className={`grid-item ${selectedMedia?.id === item.id ? 'fullscreen' : ''}`}
              onClick={selectedMedia?.id === item.id ? handleClickOutside : null}
            >
              {selectedMedia?.id !== item.id && (
                <>
                  <div className="media-header">
                    <div className="description-container">
                      {(item.description || item.content) && (
                        <div className="media-description">
                          <p className="description-text">{item.description || item.content}</p>
                        </div>
                      )}
                    </div>
                    <div className="header-top-right">
                      <span className="timestamp">{getRelativeTime(item.uploadDate)}</span>
                      <div className="menu-container">
                        <button
                          className="menu-button"
                          onClick={(e) => toggleMenu(item.id, e)}
                          title="More options"
                          aria-label="More options"
                        >
                          <FiMoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {openMenuId === item.id && (
                            <motion.div
                              className="media-panel"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                            >
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="menu-item"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleReport(item.id)}
                                className="menu-item"
                              >
                                Report
                              </button>
                              <button
                                onClick={() => handleMute(item.id)}
                                className="menu-item"
                              >
                                Mute
                              </button>
                              <button
                                onClick={() => handleBlock(item.id)}
                                className="menu-item"
                              >
                                Block
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div
                    className="media-section"
                    onClick={() => handleMediaSelect(item)}
                  >
                    {item.mediaType === 'quote' ? (
                      <div className="quoted-post">
                        <div className="quoted-header">
                          <span className="quoted-user">@{item.originalPost.user}</span>
                          <span className="quoted-time">{getRelativeTime(item.originalPost.uploadDate)}</span>
                        </div>
                        {(item.originalPost.content || item.originalPost.description) && (
                          <div className="quoted-content">
                            <p>{item.originalPost.content || item.originalPost.description}</p>
                          </div>
                        )}
                        {item.originalPost.mediaType === 'photo' && (
                          <img
                            src={item.originalPost.mediaUrl}
                            alt={item.originalPost.caption}
                            className="quoted-media"
                            width={item.originalPost.width}
                            height={item.originalPost.height}
                          />
                        )}
                        {item.originalPost.mediaType === 'video' && (
                          <div className="quoted-video">
                            <video
                              src={item.originalPost.mediaUrl}
                              className="quoted-media"
                              muted
                              width={item.originalPost.width}
                              height={item.originalPost.height}
                            />
                            <FiPlay className="video-play-icon" />
                          </div>
                        )}
                      </div>
                    ) : item.mediaType === 'photo' ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.description || item.caption}
                        className="media-content"
                        width={item.width}
                        height={item.height}
                      />
                    ) : item.mediaType === 'video' ? (
                      <div className="media-video">
                        <video
                          src={item.mediaUrl}
                          className="media-content"
                          muted
                          width={item.width}
                          height={item.height}
                          aria-describedby={
                            item.description ? `desc-${item.id}` : undefined
                          }
                        />
                        <FiPlay className="video-play-icon" />
                      </div>
                    ) : item.mediaType === 'audio' ? (
                      <div className="media-audio">
                        <FiMic size={40} />
                        <p>{item.caption}</p>
                      </div>
                    ) : item.mediaType === 'document' ? (
                      <div className="media-document">
                        <FiFile size={40} />
                        <p>{item.caption}</p>
                      </div>
                    ) : item.mediaType === 'poll' ? (
                      <div className="media-poll">
                        <FiBarChart2 size={40} />
                        <p>{item.caption}</p>
                      </div>
                    ) : item.mediaType === 'text' ? (
                      <div className="media-text">
                        <FiType size={40} />
                        <p className="text-content">{item.content}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="reactions-section">
                    <div className="twitter-actions">
                      <div className="twitter-action-btn views-count" title="Views">
                        <FiEye size={16} />
                        <span className="action-count">
                          {item.views?.toLocaleString() || 0}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(item.id);
                        }}
                        className={`twitter-action-btn love-btn ${
                          mediaReactions[item.id]?.liked ? 'active' : ''
                        }`}
                        title="Love"
                        aria-label={mediaReactions[item.id]?.liked ? 'Unlike' : 'Like'}
                      >
                        {mediaReactions[item.id]?.liked ? (
                          <FaFilledHeart size={16} />
                        ) : (
                          <FaRegHeart size={16} />
                        )}
                        <span className="action-count">
                          {(mediaLikes[item.id] || item.likes || 0).toLocaleString()}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMediaSelect(item);
                        }}
                        className="twitter-action-btn chat-btn"
                        title="Comment"
                        aria-label="View comments"
                      >
                        <FiMessageSquare size={16} />
                        <span className="action-count">
                          {item.commentCount || (item.comments || []).length}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRetweet(item.id);
                        }}
                        className={`twitter-action-btn retweet-btn ${
                          isCurrentlyRetweeted(item.id) ? 'active' : ''
                        }`}
                        title="Retweet"
                        aria-label={isCurrentlyRetweeted(item.id) ? 'Undo Retweet' : 'Retweet'}
                      >
                        <FiRepeat size={16} />
                        <span className="action-count">
                          {(mediaRetweets[item.id]?.count || item.retweetCount || 0).toLocaleString()}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuoteClick(item);
                        }}
                        className="twitter-action-btn quote-btn"
                        title="Quote Post"
                        aria-label="Quote Post"
                      >
                        <FiEdit3 size={16} />
                        <span className="action-count">
                          {item.quotePostCount || 0}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(item.id);
                        }}
                        className={`twitter-action-btn bookmark-btn ${
                          mediaBookmarks[item.id] ? 'active' : ''
                        }`}
                        title="Bookmark"
                        aria-label={mediaBookmarks[item.id] ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <FiBookmark size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedMedia?.id === item.id && (
                <>
                  <div
                    className="media-section"
                    onClick={(e) => {
                      if (e.target.closest('.quoted-post')) {
                        e.stopPropagation();
                        handleMediaSelect(item.originalPost);
                      }
                    }}
                  >
                    {item.mediaType === 'quote' ? (
                      <div
                        className="quoted-post"
                        onClick={() => handleMediaSelect(item.originalPost)}
                      >
                        <div className="quoted-header">
                          <span className="quoted-user">@{item.originalPost.user}</span>
                          <span className="quoted-time">{getRelativeTime(item.originalPost.uploadDate)}</span>
                        </div>
                        {(item.originalPost.content || item.originalPost.description) && (
                          <div className="quoted-content">
                            <p>{item.originalPost.content || item.originalPost.description}</p>
                          </div>
                        )}
                        {item.originalPost.mediaType === 'photo' && (
                          <img
                            src={item.originalPost.mediaUrl}
                            alt={item.originalPost.caption}
                            className="quoted-media-fullscreen"
                            width={item.originalPost.width}
                            height={item.originalPost.height}
                          />
                        )}
                        {item.originalPost.mediaType === 'video' && (
                          <div className="quoted-video">
                            <video
                              src={item.originalPost.mediaUrl}
                              className="quoted-media-fullscreen"
                              controls
                              autoPlay
                              width={item.originalPost.width}
                              height={item.originalPost.height}
                            />
                          </div>
                        )}
                      </div>
                    ) : item.mediaType === 'photo' ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.description || item.caption}
                        className="media-content-fullscreen"
                        width={item.width}
                        height={item.height}
                      />
                    ) : item.mediaType === 'video' ? (
                      <div className="media-video">
                        <video
                          src={item.mediaUrl}
                          className="media-content-fullscreen"
                          controls
                          autoPlay
                          width={item.width}
                          height={item.height}
                          aria-describedby={
                            item.description ? `desc-${item.id}` : undefined
                          }
                        />
                      </div>
                    ) : item.mediaType === 'audio' ? (
                      <div className="media-audio">
                        <FiMic size={48} />
                        <audio
                          src={item.mediaUrl}
                          controls
                          className="media-content"
                        />
                        <p>{item.caption}</p>
                      </div>
                    ) : item.mediaType === 'document' ? (
                      <div className="media-document">
                        <FiFile size={48} />
                        <p>{item.caption}</p>
                      </div>
                    ) : item.mediaType === 'poll' ? (
                      <div className="media-poll">
                        <FiBarChart2 size={48} />
                        <h4>{item.caption}</h4>
                        {item.pollOptions.map((option) => (
                          <div key={option.id} className="poll-option">
                            <span>{option.text}</span>
                            <span>({option.votes} votes)</span>
                          </div>
                        ))}
                      </div>
                    ) : item.mediaType === 'text' ? (
                      <div className="media-text">
                        <FiType size={48} />
                        <p className="text-content">{item.content}</p>
                      </div>
                    ) : null}
                    <button
                      className="close-button"
                      onClick={closeFullScreen}
                      aria-label="Close fullscreen"
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  <div
                    className="reactions-section"
                    ref={reactionsRef}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="twitter-actions">
                      <div className="twitter-action-btn views-count" title="Views">
                        <FiEye size={18} />
                        <span className="action-count">
                          {item.views?.toLocaleString() || 0}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(item.id);
                        }}
                        className={`twitter-action-btn love-btn ${
                          mediaReactions[item.id]?.liked ? 'active' : ''
                        }`}
                        title="Love"
                        aria-label={mediaReactions[item.id]?.liked ? 'Unlike' : 'Like'}
                      >
                        {mediaReactions[item.id]?.liked ? (
                          <FaFilledHeart size={18} />
                        ) : (
                          <FaRegHeart size={18} />
                        )}
                        <span className="action-count">
                          {(mediaLikes[item.id] || item.likes || 0).toLocaleString()}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowComments(!showComments);
                        }}
                        className={`twitter-action-btn chat-btn ${
                          showComments ? 'active' : ''
                        }`}
                        title="Comments"
                        aria-label="Toggle comments"
                      >
                        <FiMessageSquare size={18} />
                        <span className="action-count">
                          {item.commentCount || (item.comments || []).length}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRetweet(item.id);
                        }}
                        className={`twitter-action-btn retweet-btn ${
                          isCurrentlyRetweeted(item.id) ? 'active' : ''
                        }`}
                        title="Retweet"
                        aria-label={isCurrentlyRetweeted(item.id) ? 'Undo Retweet' : 'Retweet'}
                      >
                        <FiRepeat size={18} />
                        <span className="action-count">
                          {(mediaRetweets[item.id]?.count || item.retweetCount || 0).toLocaleString()}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuoteClick(item);
                        }}
                        className="twitter-action-btn quote-btn"
                        title="Quote Post"
                        aria-label="Quote Post"
                      >
                        <FiEdit3 size={18} />
                        <span className="action-count">
                          {item.quotePostCount || 0}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(item.id);
                        }}
                        className={`twitter-action-btn bookmark-btn ${
                          mediaBookmarks[item.id] ? 'active' : ''
                        }`}
                        title="Bookmark"
                        aria-label={mediaBookmarks[item.id] ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <FiBookmark size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(item);
                        }}
                        className="twitter-action-btn share-btn"
                        title="Share"
                        aria-label="Share"
                      >
                        <FiShare2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        className={`twitter-action-btn download-btn ${
                          item.mediaType === 'poll' || item.mediaType === 'text' || item.mediaType === 'quote' ? 'disabled' : ''
                        }`}
                        title="Download"
                        aria-label="Download"
                        disabled={item.mediaType === 'poll' || item.mediaType === 'text' || item.mediaType === 'quote'}
                      >
                        <FiDownload size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={`comment-section ${showComments ? 'active' : ''}`} ref={commentsRef}>
                    {showComments && (
                      <CommentsSection
                        currentMedia={item}
                        currentUser={currentUser}
                        showComments={showComments}
                        commentsRef={commentsRef}
                        mediaComments={mediaComments}
                        commentLikes={commentLikes}
                        onSubmitComment={handleSubmitComment}
                        onDeleteComment={handleDeleteComment}
                        onLikeComment={handleLikeComment}
                        onReplyToComment={handleReplyToComment}
                      />
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showQuoteModal && quoteTargetMedia && (
          <QuoteModal
            isOpen={showQuoteModal}
            onClose={() => {
              setShowQuoteModal(false);
              setQuoteTargetMedia(null);
            }}
            media={quoteTargetMedia}
            currentUser={currentUser}
            onSubmit={handleQuoteSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
};

MediaPanel.propTypes = {
  demoMode: PropTypes.bool,
  profileMedia: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      mediaUrl: PropTypes.string,
      mediaType: PropTypes.oneOf(['photo', 'video', 'audio', 'document', 'poll', 'text', 'quote']),
      caption: PropTypes.string,
      description: PropTypes.string,
      content: PropTypes.string,
      pollOptions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          text: PropTypes.string,
          votes: PropTypes.number,
        })
      ),
      user: PropTypes.string,
      userId: PropTypes.string,
      uploadDate: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),
      likes: PropTypes.number,
      comments: PropTypes.array,
      commentCount: PropTypes.number,
      views: PropTypes.number,
      quotePostCount: PropTypes.number,
      retweetCount: PropTypes.number,
      tags: PropTypes.arrayOf(PropTypes.string),
      trending: PropTypes.bool,
      width: PropTypes.number,
      height: PropTypes.number,
      isQuote: PropTypes.bool,
      originalPost: PropTypes.object,
    })
  ),
  profileUser: PropTypes.string,
  currentUser: PropTypes.string,
  compactMode: PropTypes.bool,
  onMediaSelect: PropTypes.func,
}; 