// src/KissMe/Components/MediaInteraction.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaHeart as FaFilledHeart, FaRegHeart } from 'react-icons/fa';
import { FiEye, FiMessageSquare, FiBookmark, FiShare2, FiEdit3, FiDownload } from 'react-icons/fi';
import { CommentsSection } from './CommentsSection';

const showToast = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const MediaInteraction = ({
  item,
  currentUser,
  onQuoteClick,
  onMediaSelect,
  onDelete,
  onReport,
  onMute,
  onBlock,
  isFullscreen = false,
  showComments = false,
  setShowComments,
}) => {
  const [mediaLikes, setMediaLikes] = useState(
    loadFromLocalStorage(`mediaLikes_${currentUser}`, {})
  );
  const [mediaBookmarks, setMediaBookmarks] = useState(
    loadFromLocalStorage(`mediaBookmarks_${currentUser}`, {})
  );
  const [mediaComments, setMediaComments] = useState(
    loadFromLocalStorage(`mediaComments_${currentUser}`, {})
  );
  const [commentLikes, setCommentLikes] = useState(
    loadFromLocalStorage(`commentLikes_${currentUser}`, {})
  );
  const [mediaReactions, setMediaReactions] = useState(
    loadFromLocalStorage(`mediaReactions_${currentUser}`, {})
  );
  const reactionsRef = useRef(null);
  const commentsRef = useRef(null);

  useEffect(() => {
    saveToLocalStorage(`mediaLikes_${currentUser}`, mediaLikes);
  }, [mediaLikes, currentUser]);

  useEffect(() => {
    saveToLocalStorage(`mediaBookmarks_${currentUser}`, mediaBookmarks);
  }, [mediaBookmarks, currentUser]);

  useEffect(() => {
    saveToLocalStorage(`mediaComments_${currentUser}`, mediaComments);
  }, [mediaComments, currentUser]);

  useEffect(() => {
    saveToLocalStorage(`commentLikes_${currentUser}`, commentLikes);
  }, [commentLikes, currentUser]);

  useEffect(() => {
    saveToLocalStorage(`mediaReactions_${currentUser}`, mediaReactions);
  }, [mediaReactions, currentUser]);

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

  const handleShare = async (media, e) => {
    try {
      const button = e.currentTarget;
      button.classList.add('sharing');
      setTimeout(() => button.classList.remove('sharing'), 1000);

      let shareUrl = `${window.location.origin}/post/${media.id}`;

      if (media.mediaItems && media.mediaItems.length > 0) {
        shareUrl = `${window.location.origin}/post/${media.id}`;
      } else if (
        media.mediaType !== 'poll' &&
        media.mediaType !== 'text' &&
        media.mediaType !== 'quote' &&
        media.mediaUrl
      ) {
        try {
          new URL(media.mediaUrl);
          shareUrl = media.mediaUrl;
        } catch {
          console.warn(`Invalid media URL for sharing: ${media.mediaUrl}, using post URL`);
        }
      }

      const shareData = {
        title: media.caption || media.content || media.description || 'Media Content',
        text: media.caption || media.content || media.description || 'Check out this content!',
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showToast('Content shared successfully', 'success');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Failed to share post:', error);
      showToast('Failed to share post. Please try again.', 'error');
    }
  };

  const handleDownload = async (media) => {
    if (media.mediaType === 'poll' || media.mediaType === 'text' || media.mediaType === 'quote') {
      showToast('Download not available for this content type', 'info');
      return;
    }

    try {
      if (media.mediaItems && media.mediaItems.length > 1) {
        for (let i = 0; i < media.mediaItems.length; i++) {
          const item = media.mediaItems[i];
          if (item.mediaUrl) {
            await downloadSingleFile(item, `${i + 1}_${item.caption || 'media'}`);
          }
        }
        showToast(`Downloaded ${media.mediaItems.length} files`, 'success');
      } else {
        const downloadUrl = media.mediaUrl || (media.mediaItems && media.mediaItems[0]?.mediaUrl);
        if (downloadUrl) {
          await downloadSingleFile(media, media.caption || 'media');
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to download media. Please try again.', 'error');
    }
  };

  const downloadSingleFile = async (media, filename) => {
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
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmitComment = async (commentData) => {
    try {
      setMediaComments((prev) => {
        const updated = {
          ...prev,
          [item.id]: [
            ...(Array.isArray(prev[item.id]) ? prev[item.id] : []),
            { ...commentData, likes: 0 },
          ],
        };
        saveToLocalStorage(`mediaComments_${currentUser}`, updated);
        return updated;
      });
      // Update commentCount in item
      item.commentCount = (item.commentCount || 0) + 1;
      showToast('Comment posted', 'success');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      showToast('Failed to post comment', 'error');
    }
  };

  const handleDeleteComment = (commentId) => {
    try {
      setMediaComments((prev) => {
        const updated = {
          ...prev,
          [item.id]: (prev[item.id] || []).filter((c) => c.id !== commentId),
        };
        saveToLocalStorage(`mediaComments_${currentUser}`, updated);
        return updated;
      });
      // Update commentCount in item
      item.commentCount = Math.max(0, (item.commentCount || 0) - 1);
      setCommentLikes((prevLikes) => {
        const updated = { ...prevLikes };
        delete updated[commentId];
        saveToLocalStorage(`commentLikes_${currentUser}`, updated);
        return updated;
      });
      showToast('Comment deleted', 'success');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('Failed to delete comment', 'error');
    }
  };

  const handleLikeComment = (commentId) => {
    try {
      setCommentLikes((prev) => {
        const isLiked = prev[commentId];
        const updated = {
          ...prev,
          [commentId]: !isLiked,
        };
        saveToLocalStorage(`commentLikes_${currentUser}`, updated);
        return updated;
      });
      setMediaComments((prev) => {
        const updatedComments = { ...prev };
        const comments = Array.isArray(prev[item.id]) ? prev[item.id] : [];
        const updated = comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes: commentLikes[commentId] ? (comment.likes || 0) : (comment.likes || 0) + 1 }
            : comment
        );
        updatedComments[item.id] = updated;
        saveToLocalStorage(`mediaComments_${currentUser}`, updatedComments);
        return updatedComments;
      });
      showToast('Comment like updated', 'success');
    } catch (error) {
      console.error('Failed to like comment:', error);
      showToast('Failed to like comment', 'error');
    }
  };

  const handleReplyToComment = (commentId, reply) => {
    try {
      setMediaComments((prev) => {
        const updatedComments = { ...prev };
        const comments = Array.isArray(prev[item.id]) ? prev[item.id] : [];
        const updated = comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(Array.isArray(comment.replies) ? comment.replies : []), reply],
              }
            : comment
        );
        updatedComments[item.id] = updated;
        saveToLocalStorage(`mediaComments_${currentUser}`, updatedComments);
        return updatedComments;
      });
      showToast('Reply posted', 'success');
    } catch (error) {
      console.error('Failed to reply to comment:', error);
      showToast('Failed to post reply', 'error');
    }
  };

  return (
    <>
      <div
        className="reactions-section"
        ref={reactionsRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="twitter-actions">
          <div className="twitter-action-btn views-count" title="Views">
            <FiEye size={isFullscreen ? 18 : 16} />
            <span className="action-count">{item.views?.toLocaleString() || 0}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(item.id);
            }}
            className={`twitter-action-btn love-btn ${mediaReactions[item.id]?.liked ? 'active' : ''}`}
            title="Love"
            aria-label={mediaReactions[item.id]?.liked ? 'Unlike' : 'Like'}
          >
            {mediaReactions[item.id]?.liked ? (
              <FaFilledHeart size={isFullscreen ? 18 : 16} />
            ) : (
              <FaRegHeart size={isFullscreen ? 18 : 16} />
            )}
            <span className="action-count">
              {(mediaLikes[item.id] || item.likes || 0).toLocaleString()}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isFullscreen) {
                setShowComments(!showComments);
              } else {
                onMediaSelect(item);
              }
            }}
            className={`twitter-action-btn chat-btn ${showComments && isFullscreen ? 'active' : ''}`}
            title="Comments"
            aria-label="Toggle comments"
            disabled={!isFullscreen && !onMediaSelect}
          >
            <FiMessageSquare size={isFullscreen ? 18 : 16} />
            <span className="action-count">{item.commentCount || (mediaComments[item.id] || []).length}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuoteClick();
            }}
            className="twitter-action-btn quote-btn"
            title="Quote Post"
            aria-label="Quote Post"
          >
            <FiEdit3 size={isFullscreen ? 18 : 16} />
            <span className="action-count">{item.quotePostCount || 0}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(item.id);
            }}
            className={`twitter-action-btn bookmark-btn ${mediaBookmarks[item.id] ? 'active' : ''}`}
            title="Bookmark"
            aria-label={mediaBookmarks[item.id] ? 'Remove bookmark' : 'Bookmark'}
          >
            <FiBookmark size={isFullscreen ? 18 : 16} />
          </button>
          {isFullscreen && (
            <>
              <button
                onClick={(e) => handleShare(item, e)}
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
            </>
          )}
        </div>
      </div>
      {isFullscreen && (
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
      )}
    </>
  );
};

MediaInteraction.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    mediaUrl: PropTypes.string,
    mediaType: PropTypes.oneOf(['photo', 'video', 'audio', 'document', 'poll', 'text', 'quote', 'multi-media']),
    caption: PropTypes.string,
    description: PropTypes.string,
    content: PropTypes.string,
    mediaItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        mediaUrl: PropTypes.string,
        mediaType: PropTypes.string,
        caption: PropTypes.string,
        description: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
        originalFile: PropTypes.object,
      })
    ),
    pollOptions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        text: PropTypes.string,
        votes: PropTypes.number,
      })
    ),
    user: PropTypes.string,
    userId: PropTypes.string,
    uploadDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    likes: PropTypes.number,
    comments: PropTypes.array,
    commentCount: PropTypes.number,
    views: PropTypes.number,
    quotePostCount: PropTypes.number,
    isQuote: PropTypes.bool,
    originalPost: PropTypes.object,
  }).isRequired,
  currentUser: PropTypes.string.isRequired,
  onQuoteClick: PropTypes.func.isRequired,
  onMediaSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  onMute: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  isFullscreen: PropTypes.bool,
  showComments: PropTypes.bool,
  setShowComments: PropTypes.func,
};

MediaInteraction.defaultProps = {
  isFullscreen: false,
  showComments: false,
  setShowComments: () => {},
};