// MediaContent.js
import React from 'react';
import PropTypes from 'prop-types';
import { FiPlay, FiMic, FiFile, FiBarChart2, FiType } from 'react-icons/fi';

export const MediaContent = ({ item, userData, handleMediaSelect, isFullscreen = false }) => {
  const renderQuoteContent = () => (
    <div
      className="quoted-postPool"
      onClick={item.originalPost ? () => handleMediaSelect(item.originalPost) : null}
    >
      <div className="quoted-headerPool">
        <div className="user-infoPool">
          <img
            src={
              userData[item.originalPost.userId]?.avatar ||
              'https://via.placeholder.com/24'
            }
            alt={userData[item.originalPost.userId]?.username || item.originalPost.user}
            className="user-avatarPool smallPool"
          />
          <span className="quoted-userPool">
            {userData[item.originalPost.userId]?.username || item.originalPost.user}
          </span>
          <span className="quoted-handlePool">
            {userData[item.originalPost.userId]?.handle || '@unknown'}
          </span>
        </div>
        <span className="quoted-timePool">{getRelativeTime(item.originalPost.uploadDate)}</span>
      </div>
      {(item.originalPost.content || item.originalPost.description) && (
        <div className="quoted-contentPool">
          <p>{item.originalPost.content || item.originalPost.description}</p>
        </div>
      )}
      {item.originalPost.mediaType === 'photo' && (
        <img
          src={item.originalPost.mediaUrl}
          alt={item.originalPost.caption}
          className={isFullscreen ? 'quoted-media-fullscreenPool' : 'quoted-mediaPool'}
          width={item.originalPost.width}
          height={item.originalPost.height}
        />
      )}
      {item.originalPost.mediaType === 'video' && (
        <div className="quoted-videoPool">
          <video
            src={item.originalPost.mediaUrl}
            className={isFullscreen ? 'quoted-media-fullscreenPool' : 'quoted-mediaPool'}
            controls={isFullscreen}
            autoPlay={isFullscreen}
            width={item.originalPost.width}
            height={item.originalPost.height}
          />
          {!isFullscreen && <FiPlay className="video-play-iconPool" />}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="media-sectionPool"
      onClick={() => handleMediaSelect(item)}
    >
      {item.mediaType === 'quote' ? (
        renderQuoteContent()
      ) : item.mediaType === 'photo' ? (
        <img
          src={item.mediaUrl}
          alt={item.description || item.caption}
          className={isFullscreen ? 'media-content-fullscreenPool' : 'media-contentPool'}
          width={item.width}
          height={item.height}
        />
      ) : item.mediaType === 'video' ? (
        <div className="media-videoPool">
          <video
            src={item.mediaUrl}
            className={isFullscreen ? 'media-content-fullscreenPool' : 'media-contentPool'}
            controls={isFullscreen}
            autoPlay={isFullscreen}
            width={item.width}
            height={item.height}
            aria-describedby={item.description ? `desc-${item.id}` : undefined}
          />
          {!isFullscreen && <FiPlay className="video-play-iconPool" />}
        </div>
      ) : item.mediaType === 'audio' ? (
        <div className="media-audioPool">
          <FiMic size={isFullscreen ? 48 : 40} />
          {isFullscreen && (
            <audio
              src={item.mediaUrl}
              controls
              className="media-contentPool"
            />
          )}
          <p>{item.caption}</p>
        </div>
      ) : item.mediaType === 'document' ? (
        <div className="media-documentPool">
          <FiFile size={isFullscreen ? 48 : 40} />
          <p>{item.caption}</p>
        </div>
      ) : item.mediaType === 'poll' ? (
        <div className="media-pollPool">
          <FiBarChart2 size={isFullscreen ? 48 : 40} />
          <h4>{item.caption}</h4>
          {item.pollOptions.map((option) => (
            <div key={option.id} className="poll-optionPool">
              <span>{option.text}</span>
              <span>({option.votes} votes)</span>
            </div>
          ))}
        </div>
      ) : item.mediaType === 'text' ? (
        <div className="media-textPool">
          <FiType size={isFullscreen ? 48 : 40} />
          <p className="text-contentPool">{item.content}</p>
        </div>
      ) : null}
    </div>
  );
};

MediaContent.propTypes = {
  item: PropTypes.object.isRequired,
  userData: PropTypes.object.isRequired,
  handleMediaSelect: PropTypes.func.isRequired,
  isFullscreen: PropTypes.bool,
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

