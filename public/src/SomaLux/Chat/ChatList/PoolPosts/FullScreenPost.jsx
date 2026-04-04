import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { PostHeader } from './PostHeader';
import { MediaContent } from './MediaContent';
import { ReactionsSection } from './ReactionsSection';
import { CommentsSection } from '../Components/CommentsSection';

export const FullScreenPost = ({
  item,
  userData,
  currentUser,
  openMenuId,
  toggleMenu,
  handleDelete,
  handleReport,
  handleMute,
  handleBlock,
  toggleFollow,
  followedUsers,
  handleMediaSelect,
  mediaReactions,
  mediaLikes,
  mediaBookmarks,
  toggleLike,
  handleQuoteClick,
  toggleBookmark,
  handleShare,
  handleDownload,
  showComments,
  setShowComments,
  closeFullScreen,
  mediaComments,
  commentLikes,
  handleSubmitComment,
  handleDeleteComment,
  handleLikeComment,
  handleReplyToComment,
  reactionsRef,
  commentsRef,
  handleCopyLink,
  handlePin,
}) => {
  // Trap focus for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFullScreen();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeFullScreen]);

  return (
    <AnimatePresence>
      <motion.div
        className="fullscreen-post"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          if (
            !reactionsRef.current?.contains(e.target) &&
            !commentsRef.current?.contains(e.target) &&
            !e.target.closest('.post-content') &&
            !e.target.closest('.close-button') &&
            !e.target.closest('.comment-section') &&
            !e.target.closest('.quote-modal')
          ) {
            closeFullScreen();
          }
        }}
        role="dialog"
        aria-labelledby={`fullscreen-post-${item.id}`}
        aria-modal="true"
      >
        <motion.div
          className="post-content"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <button
            className="close-button"
            onClick={closeFullScreen}
            aria-label="Close fullscreen post"
          >
            <FiX size={24} />
          </button>
          <PostHeader
            item={item}
            userData={userData}
            currentUser={currentUser}
            openMenuId={openMenuId}
            toggleMenu={toggleMenu}
            handleDelete={handleDelete}
            handleReport={handleReport}
            handleMute={handleMute}
            handleBlock={handleBlock}
            toggleFollow={toggleFollow}
            followedUsers={followedUsers}
            handleCopyLink={handleCopyLink}
            handlePin={handlePin}
          />
          <div className="content-body">
            {(item.description || item.content) && (
              <div className="post-text">
                <p className="content-text">{item.description || item.content}</p>
              </div>
            )}
            <MediaContent
              item={item}
              userData={userData}
              handleMediaSelect={handleMediaSelect}
              isFullscreen
            />
          </div>
          <ReactionsSection
            item={item}
            mediaReactions={mediaReactions}
            mediaLikes={mediaLikes}
            mediaBookmarks={mediaBookmarks}
            toggleLike={toggleLike}
            handleQuoteClick={handleQuoteClick}
            toggleBookmark={toggleBookmark}
            handleShare={handleShare}
            handleDownload={handleDownload}
            setShowComments={setShowComments}
            showComments={showComments}
            isFullscreen
          />
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

FullScreenPost.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    user: PropTypes.string,
    uploadDate: PropTypes.string.isRequired,
    description: PropTypes.string,
    content: PropTypes.string,
    originalPost: PropTypes.object,
  }).isRequired,
  userData: PropTypes.objectOf(
    PropTypes.shape({
      username: PropTypes.string,
      handle: PropTypes.string,
      avatar: PropTypes.string,
    })
  ).isRequired,
  currentUser: PropTypes.string.isRequired,
  openMenuId: PropTypes.string,
  toggleMenu: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleReport: PropTypes.func.isRequired,
  handleMute: PropTypes.func.isRequired,
  handleBlock: PropTypes.func.isRequired,
  toggleFollow: PropTypes.func.isRequired,
  followedUsers: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleMediaSelect: PropTypes.func.isRequired,
  mediaReactions: PropTypes.object.isRequired,
  mediaLikes: PropTypes.object.isRequired,
  mediaBookmarks: PropTypes.object.isRequired,
  toggleLike: PropTypes.func.isRequired,
  handleQuoteClick: PropTypes.func.isRequired,
  toggleBookmark: PropTypes.func.isRequired,
  handleShare: PropTypes.func.isRequired,
  handleDownload: PropTypes.func.isRequired,
  showComments: PropTypes.bool.isRequired,
  setShowComments: PropTypes.func.isRequired,
  closeFullScreen: PropTypes.func.isRequired,
  mediaComments: PropTypes.object.isRequired,
  commentLikes: PropTypes.object.isRequired,
  handleSubmitComment: PropTypes.func.isRequired,
  handleDeleteComment: PropTypes.func.isRequired,
  handleLikeComment: PropTypes.func.isRequired,
  handleReplyToComment: PropTypes.func.isRequired,
  reactionsRef: PropTypes.object.isRequired,
  commentsRef: PropTypes.object.isRequired,
  handleCopyLink: PropTypes.func.isRequired,
  handlePin: PropTypes.func.isRequired,
};