// ReactionsSection.js
import React from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiMessageSquare, FiEdit3, FiBookmark, FiShare2, FiDownload } from 'react-icons/fi';
import { FaHeart as FaFilledHeart, FaRegHeart } from 'react-icons/fa';

export const ReactionsSection = ({
  item,
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
  isFullscreen = false,
}) => {
  return (
    <div className="reactions-sectionPool" onClick={(e) => e.stopPropagation()}>
      <div className="twitter-actionsPool">
        <div className="twitter-action-btnPool views-countPool" title="Views">
          <FiEye size={isFullscreen ? 18 : 16} />
          <span className="action-countPool">
            {item.views?.toLocaleString() || 0}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(item.id);
          }}
          className={`twitter-action-btnPool love-btnPool ${
            mediaReactions[item.id]?.liked ? 'activePool' : ''
          }`}
          title="Love"
          aria-label={mediaReactions[item.id]?.liked ? 'Unlike' : 'Like'}
        >
          {mediaReactions[item.id]?.liked ? (
            <FaFilledHeart size={isFullscreen ? 18 : 16} />
          ) : (
            <FaRegHeart size={isFullscreen ? 18 : 16} />
          )}
          <span className="action-countPool">
            {(mediaLikes[item.id] || item.likes || 0).toLocaleString()}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          className={`twitter-action-btnPool chat-btnPool ${
            showComments ? 'activePool' : ''
          }`}
          title="Comments"
          aria-label="Toggle comments"
        >
          <FiMessageSquare size={isFullscreen ? 18 : 16} />
          <span className="action-countPool">
            {item.commentCount || (item.comments || []).length}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuoteClick(item);
          }}
          className="twitter-action-btnPool quote-btnPool"
          title="Quote Post"
          aria-label="Quote Post"
        >
          <FiEdit3 size={isFullscreen ? 18 : 16} />
          <span className="action-countPool">
            {item.quotePostCount || 0}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(item.id);
          }}
          className={`twitter-action-btnPool bookmark-btnPool ${
            mediaBookmarks[item.id] ? 'activePool' : ''
          }`}
          title="Bookmark"
          aria-label={mediaBookmarks[item.id] ? 'Remove bookmark' : 'Bookmark'}
        >
          <FiBookmark size={isFullscreen ? 18 : 16} />
        </button>
        {isFullscreen && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare(item);
              }}
              className="twitter-action-btnPool share-btnPool"
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
              className={`twitter-action-btnPool download-btnPool ${
                item.mediaType === 'poll' || item.mediaType === 'text' || item.mediaType === 'quote' ? 'disabledPool' : ''
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
  );
};

ReactionsSection.propTypes = {
  item: PropTypes.object.isRequired,
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
  isFullscreen: PropTypes.bool,
};

