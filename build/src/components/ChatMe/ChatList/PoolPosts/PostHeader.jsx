// PostHeader.js
import React from 'react';
import PropTypes from 'prop-types';
import { FiMoreVertical } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const PostHeader = ({ item, userData, currentUser, openMenuId, toggleMenu, handleDelete, handleReport, handleMute, handleBlock, toggleFollow, followedUsers }) => {
  return (
    <div className="media-headerPool">
      <div className="user-infoPool">
        <img
          src={userData[item.userId]?.avatar || 'https://via.placeholder.com/40'}
          alt={userData[item.userId]?.username || item.user}
          className="user-avatarPool"
        />
        <div className="user-detailsPool">
          <span className="usernamePool">{userData[item.userId]?.username || item.user}</span>
          <span className="handlePool">{userData[item.userId]?.handle || '@unknown'}</span>
        </div>
      </div>
      <div className="header-top-rightPool">
        <span className="timestampPool">{getRelativeTime(item.uploadDate)}</span>
        <div className="menu-containerPool">
          <button
            className="menu-buttonPool"
            onClick={(e) => toggleMenu(item.id, e)}
            title="More options"
            aria-label="More options"
          >
            <FiMoreVertical size={16} />
          </button>
          <AnimatePresence>
            {openMenuId === item.id && (
              <motion.div
                className="menu-panelPool"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {item.userId === currentUser && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="menu-itemPool"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => handleReport(item.id)}
                  className="menu-itemPool"
                >
                  Report
                </button>
                <button
                  onClick={() => handleMute(item.id)}
                  className="menu-itemPool"
                >
                  Mute @{userData[item.userId]?.handle || 'unknown'}
                </button>
                <button
                  onClick={() => handleBlock(item.id)}
                  className="menu-itemPool"
                >
                  Block @{userData[item.userId]?.handle || 'unknown'}
                </button>
                {item.userId !== currentUser && (
                  <button
                    onClick={() => toggleFollow(item.userId)}
                    className="menu-itemPool"
                  >
                    {followedUsers.includes(item.userId) ? 'Unfollow' : 'Follow'} @
                    {userData[item.userId]?.handle || 'unknown'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

PostHeader.propTypes = {
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
};

// Placeholder function (should be imported or passed as a prop)
const getRelativeTime = (date) => {
  const now = new Date();
  const timestamp = new Date(date);
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

