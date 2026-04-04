// PostCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {PostHeader} from './PostHeader';
import {MediaContent} from './MediaContent';
import {ReactionsSection} from './ReactionsSection';

export const PostCard = ({
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
  setShowComments,
  showComments,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      layout
      className="grid-itemPool"
    >
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
      />
      <div className="description-containerPool">
        {(item.description || item.content) && (
          <div className="media-descriptionPool">
            <p className="description-textPool">{item.description || item.content}</p>
          </div>
        )}
      </div>
      <MediaContent
        item={item}
        userData={userData}
        handleMediaSelect={handleMediaSelect}
      />
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
      />
    </motion.div>
  );
};

PostCard.propTypes = {
  item: PropTypes.object.isRequired,
  userData: PropTypes.object.isRequired,
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
  setShowComments: PropTypes.func.isRequired,
  showComments: PropTypes.bool.isRequired,
};

