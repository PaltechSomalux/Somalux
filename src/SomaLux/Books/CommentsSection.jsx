// src/KissMe/Components/CommentsSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiHeart, FiImage, FiX, FiMoreVertical } from 'react-icons/fi';
import './CommentsSection.css';

const showToast = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

const getRelativeTime = (date) => {
  const now = new Date();
  const timestamp = new Date(date);
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

const Comment = ({ comment, mediaId, currentUser, onDelete, onLikeToggle, onReply }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyMedia, setReplyMedia] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (showReplyInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showReplyInput]);

  useEffect(() => {
    return () => {
      if (replyMedia) {
        URL.revokeObjectURL(replyMedia.url);
      }
    };
  }, [replyMedia]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && !replyMedia) {
      showToast('Reply cannot be empty', 'error');
      return;
    }

    setIsReplying(true);
    const newReply = {
      id: `r-${Date.now()}`,
      user: currentUser,
      text: replyText,
      timestamp: new Date().toISOString(),
      liked: false,
      file: replyMedia || null,
      media: replyMedia
        ? {
            type: replyMedia.type.startsWith('image') ? 'image' : replyMedia.type.startsWith('video') ? 'video' : 'audio',
            url: URL.createObjectURL(replyMedia),
          }
        : null,
    };

    try {
      await onReply(comment.id, newReply);
      setReplyText('');
      setReplyMedia(null);
      setShowReplyInput(false);
      showToast('Reply posted', 'success');
    } catch (error) {
      console.error('Failed to post reply:', error);
      showToast('Failed to post reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/'))) {
      setReplyMedia(file);
    } else {
      showToast('Only image, video, or audio files are allowed', 'error');
    }
  };

  const handleMenuAction = (action) => {
    if (action === 'delete') {
      onDelete(comment.id);
    }
    // Placeholder for other actions (edit, copy, pin)
    console.log(`${action} action triggered for comment ${comment.id}`);
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="comment-comments"
    >
      <div className="comment-header-comments">
        <span className="comment-user-comments">@{comment.user}</span>
        <span className="comment-time-comments">{getRelativeTime(comment.timestamp)}</span>
        <div className="comment-header-actions-comments">
          {Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <button
              className="replies-toggle-btn-comments"
              onClick={() => setShowReplies(!showReplies)}
              aria-expanded={showReplies}
              aria-controls={`replies-${comment.id}`}
              title={showReplies ? 'Hide replies' : 'Show replies'}
            >
              {showReplies ? 'Hide replies' : 'Replies'} ({comment.replies.length})
            </button>
          )}
          <div className="menu-container-comments" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="menu-btn-comments"
              title="More options"
              aria-label="More options"
            >
              <FiMoreVertical size={14} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="menu-dropdown-comments"
                >
                  <button
                    onClick={() => handleMenuAction('delete')}
                    className="menu-item-comments"
                    disabled={comment.user !== currentUser}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleMenuAction('edit')}
                    className="menu-item-comments"
                    disabled={comment.user !== currentUser}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleMenuAction('copy')}
                    className="menu-item-comments"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleMenuAction('pin')}
                    className="menu-item-comments"
                    disabled={comment.user !== currentUser}
                  >
                    Pin
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <p className="comment-text-comments">{comment.text}</p>
      {comment.media && (
        <div className="comment-media-comments">
          {comment.media.type === 'image' ? (
          <img src={comment.media.url} alt="Attached media" className="comment-media-img-comments" />
        ) : comment.media.type === 'video' ? (
          <video src={comment.media.url} controls className="comment-media-video-comments" />
        ) : (
          <audio src={comment.media.url} controls className="comment-media-audio-comments" />
        )}
        </div>
      )}
      <div className="comment-actions-comments">
        <button
          onClick={() => onLikeToggle(comment.id)}
          className={`comment-like-btn-comments ${comment.liked ? 'liked-comments' : ''}`}
          title={comment.liked ? 'Unlike' : 'Like'}
          aria-label={comment.liked ? 'Unlike' : 'Like'}
        >
          <FiHeart size={16} />
          <span className="like-count-comments">{comment.likes || 0}</span>
        </button>
        <button
          onClick={() => setShowReplyInput(!showReplyInput)}
          className="reply-btn-comments"
          title="Reply"
          aria-label="Reply to comment"
        >
          Reply
        </button>
      </div>
      <AnimatePresence>
        {showReplyInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleReplySubmit}
            className="reply-form-comments"
          >
            <div className="reply-input-container-comments">
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Replying to @${comment.user}`}
                className="reply-input-comments"
                maxLength={280}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*,audio/*"
                onChange={handleMediaUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="menu-upload-btn-comments"
                title="Attach media"
              >
                {replyMedia ? <FiX size={16} /> : <FiImage size={26} />}
              </button>
              <button
                type="submit"
                disabled={(!replyText.trim() && !replyMedia) || isReplying}
                className="send-reply-btn-comments"
              >
                {isReplying ? '...' : <FiSend size={18} />}
              </button>
            </div>
            {replyMedia && (
              <div className="media-preview-comments">
                {replyMedia.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(replyMedia)} alt="Preview" className="preview-img-comments" />
                ) : replyMedia.type.startsWith('video') ? (
                  <video src={URL.createObjectURL(replyMedia)} controls className="preview-video-comments" />
                ) : (
                  <audio src={URL.createObjectURL(replyMedia)} controls className="preview-audio-comments" />
                )}
                <button
                  type="button"
                  onClick={() => setReplyMedia(null)}
                  className="remove-media-btn-comments"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {Array.isArray(comment.replies) && comment.replies.length > 0 && showReplies && (
          <motion.div
            id={`replies-${comment.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="replies-tree-comments"
          >
            {comment.replies.map((reply, idx) => (
              <div key={reply.id} className={`tree-item-comments ${idx === comment.replies.length - 1 ? 'is-last' : ''}`}>
                <div className="tree-branch-comments" />
                <div className="tree-content-comments">
                  <div className="reply-header-comments">
                    <span className="reply-user-comments">@{reply.user}</span>
                    <span className="reply-time-comments">{getRelativeTime(reply.timestamp)}</span>
                  </div>
                  <p className="reply-text-comments">{reply.text}</p>
                  {reply.media && (
                    <div className="reply-media-comments">
                      {reply.media.type === 'image' ? (
                        <img src={reply.media.url} alt="Attached media" className="reply-media-img-comments" />
                      ) : reply.media.type === 'video' ? (
                        <video src={reply.media.url} controls className="reply-media-video-comments" />
                      ) : (
                        <audio src={reply.media.url} controls className="reply-media-audio-comments" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const CommentsSection = ({
  currentMedia,
  currentUser,
  showComments,
  commentsRef,
  mediaComments,
  commentLikes,
  onSubmitComment,
  onDeleteComment,
  onLikeComment,
  onReplyToComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (attachedMedia) {
        URL.revokeObjectURL(attachedMedia.url);
      }
    };
  }, [attachedMedia]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && !attachedMedia) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    const commentData = {
      id: `c-${Date.now()}`,
      user: currentUser,
      text: newComment,
      timestamp: new Date().toISOString(),
      liked: false,
      replies: [],
      likes: 0,
      file: attachedMedia || null,
      media: attachedMedia
        ? {
            type: attachedMedia.type.startsWith('image') ? 'image' : attachedMedia.type.startsWith('video') ? 'video' : 'audio',
            url: URL.createObjectURL(attachedMedia),
          }
        : null,
    };

    try {
      await onSubmitComment(commentData);
      setNewComment('');
      setAttachedMedia(null);
      showToast('Comment posted', 'success');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      showToast('Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/'))) {
      setAttachedMedia(file);
    } else {
      showToast('Only image, video, or audio files are allowed', 'error');
    }
  };

  const comments = mediaComments[currentMedia.id] || [];

  return (
    <AnimatePresence>
      {showComments && (
        <motion.div
          ref={commentsRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="comment-section-comments"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="comments-header-comments">
            <h3 className="comments-title-comments">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
          </div>
          <div className="comments-list-comments">
            <AnimatePresence>
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={{
                      ...comment,
                      liked: !!commentLikes[comment.id],
                      likes: commentLikes[comment.id] ? (comment.likes || 0) + 1 : comment.likes || 0,
                    }}
                    mediaId={currentMedia.id}
                    currentUser={currentUser}
                    onDelete={onDeleteComment}
                    onLikeToggle={onLikeComment}
                    onReply={onReplyToComment}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
          <form onSubmit={handleSubmit} className="new-comment-form-comments">
            <div className="new-comment-input-container-comments">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="new-comment-input-comments"
                maxLength={280}
                disabled={isSubmitting}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="media-upload-btn-comments"
                title="Attach media"
              >
                {attachedMedia ? <FiX size={24} /> : <FiImage size={26} />}
              </button>
              <button
                type="submit"
                disabled={(!newComment.trim() && !attachedMedia) || isSubmitting}
                className="submit-comment-btn-comments"
              >
                {isSubmitting ? '...' : <FiSend size={18} />}
              </button>
            </div>
            <div className="character-count-comments">
              {newComment.length}/280
            </div>
            {attachedMedia && (
              <div className="media-preview-comments">
                {attachedMedia.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(attachedMedia)} alt="Preview" className="preview-img-comments" />
                ) : attachedMedia.type.startsWith('video') ? (
                  <video src={URL.createObjectURL(attachedMedia)} controls className="preview-video-comments" />
                ) : (
                  <audio src={URL.createObjectURL(attachedMedia)} controls className="preview-audio-comments" />
                )}
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  className="remove-media-btn-comments"
                >
                  <FiX size={18} />
                </button>
              </div>
            )}
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

CommentsSection.propTypes = {
  currentMedia: PropTypes.shape({
    id: PropTypes.string.isRequired,
    comments: PropTypes.array,
  }).isRequired,
  currentUser: PropTypes.string.isRequired,
  showComments: PropTypes.bool.isRequired,
  commentsRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  mediaComments: PropTypes.object.isRequired,
  commentLikes: PropTypes.object.isRequired,
  onSubmitComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  onLikeComment: PropTypes.func.isRequired,
  onReplyToComment: PropTypes.func.isRequired,
};

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    liked: PropTypes.bool,
    likes: PropTypes.number,
    replies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        user: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired,
        media: PropTypes.shape({
          type: PropTypes.oneOf(['image', 'video']),
          url: PropTypes.string,
        }),
      })
    ),
    media: PropTypes.shape({
      type: PropTypes.oneOf(['image', 'video']),
      url: PropTypes.string,
    }),
  }).isRequired,
  mediaId: PropTypes.string.isRequired,
  currentUser: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  onLikeToggle: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
};