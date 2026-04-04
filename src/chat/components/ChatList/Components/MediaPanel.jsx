// src/KissMe/Components/MediaPanel.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye,
  FiX,
  FiMoreVertical,
  FiPlay,
  FiMic,
  FiFile,
  FiBarChart2,
  FiType,
} from 'react-icons/fi';
import { MediaCarousel } from './MediaCarousel';
import { QuoteModal } from './QuoteModal';
import { CommentsSection } from './CommentsSection';
import { MediaInteraction } from './MediaInteraction';
import { getRelativeTime } from './Utils';
import './MediaPanel.css';

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

const groupMediaIntoSinglePosts = (mediaArray) => {
  const grouped = new Map();
  const ungrouped = [];

  mediaArray.forEach((item) => {
    const uploadTime = new Date(item.uploadDate || item.createdAt).getTime();
    const timeKey = Math.floor(uploadTime / 1000);
    const groupKey = `${item.userId || item.user}_${timeKey}`;

    const canBeGrouped = ['photo', 'video', 'audio', 'document'].includes(item.mediaType);

    if (canBeGrouped && item.mediaUrl) {
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: item.id || `group-${groupKey}`,
          user: item.user,
          userId: item.userId,
          uploadDate: item.uploadDate || item.createdAt,
          description: item.description || item.content || '',
          likes: item.likes || 0,
          comments: item.comments || [],
          commentCount: item.commentCount || 0,
          views: item.views || 0,
          mediaItems: [],
          quotePostCount: item.quotePostCount || 0,
          isQuote: item.isQuote || false,
          originalPost: item.originalPost || null,
          mediaType: 'multi-media',
        });
      }

      grouped.get(groupKey).mediaItems.push({
        id: item.id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        caption: item.caption || '',
        description: item.description || '',
        width: item.width,
        height: item.height,
        originalFile: item.originalFile,
      });
    } else {
      ungrouped.push({
        ...item,
        mediaItems: item.mediaUrl
          ? [{
              id: item.id,
              mediaUrl: item.mediaUrl,
              mediaType: item.mediaType,
              caption: item.caption || '',
              description: item.description || '',
              width: item.width,
              height: item.height,
              originalFile: item.originalFile,
            }]
          : [],
      });
    }
  });

  const groupedArray = Array.from(grouped.values()).map((group) => ({
    ...group,
    ...(group.mediaItems.length === 1 && {
      mediaType: group.mediaItems[0].mediaType,
      mediaUrl: group.mediaItems[0].mediaUrl,
      caption: group.mediaItems[0].caption,
      width: group.mediaItems[0].width,
      height: group.mediaItems[0].height,
      originalFile: group.mediaItems[0].originalFile,
    }),
  }));

  return [...groupedArray, ...ungrouped].sort(
    (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
  );
};

export const MediaPanel = ({
  demoMode = false,
  profileMedia = [],
  profileUser,
  currentUser = 'current_user',
  compactMode = false,
  onMediaSelect,
  onMediaDelete,
}) => {
  const [media, setMedia] = useState([]);
  const [displayedMedia, setDisplayedMedia] = useState([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState(
    loadFromLocalStorage(`deletedMediaIds_${currentUser}`, [])
  );
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteTargetMedia, setQuoteTargetMedia] = useState(null);

  useEffect(() => {
    saveToLocalStorage(`deletedMediaIds_${currentUser}`, deletedMediaIds);
  }, [deletedMediaIds, currentUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Processing media data...');
      let dataToUse = [...media];

      if (profileMedia && profileMedia.length > 0) {
        const existingIds = new Set(media.map((item) => item.id));
        const newMedia = profileMedia.filter((item) => !existingIds.has(item.id));
        dataToUse = [...media, ...newMedia];
      }

      if (dataToUse.length === 0) {
        setMedia([]);
        setDisplayedMedia([]);
        setLoading(false);
        return;
      }

      const groupedData = groupMediaIntoSinglePosts(dataToUse);

      const processedData = groupedData
        .filter((item) => !deletedMediaIds.includes(item.id))
        .map((item) => ({
          ...item,
          user: profileUser || item.user || 'Unknown User',
          comments: Array.isArray(item.comments) ? item.comments : [],
          commentCount: item.commentCount !== undefined
            ? item.commentCount
            : Array.isArray(item.comments)
            ? item.comments.length
            : 0,
          description: item.description || '',
          content: item.content || '',
          pollOptions: item.pollOptions || [],
          uploadDate: item.uploadDate || item.createdAt || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

      console.log('Processed grouped media:', processedData);
      setMedia(processedData);
      setDisplayedMedia(processedData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [profileMedia, profileUser, deletedMediaIds]);

  const handleMediaSelect = (item) => {
    const mediaToSelect = item.mediaType === 'quote' && item.originalPost ? item.originalPost : item;
    setSelectedMedia(mediaToSelect);
    setShowComments(false);
    setOpenMenuId(null);
    if (onMediaSelect) {
      onMediaSelect(mediaToSelect, !!mediaToSelect);
    }
  };

  const closeFullScreen = () => {
    setSelectedMedia(null);
    setShowComments(false);
    setOpenMenuId(null);
    if (onMediaSelect) {
      onMediaSelect(null, false);
    }
  };

  const toggleMenu = (mediaId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === mediaId ? null : mediaId);
  };

  const handleDelete = (mediaId) => {
    try {
      setDeletedMediaIds((prev) => {
        const updated = [...prev, mediaId];
        saveToLocalStorage(`deletedMediaIds_${currentUser}`, updated);
        return updated;
      });

      setMedia((prev) =>
        prev.filter((item) => item.id !== mediaId).sort(
          (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
        )
      );

      setDisplayedMedia((prev) =>
        prev.filter((item) => item.id !== mediaId).sort(
          (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
        )
      );

      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(null);
        setShowComments(false);
        if (onMediaSelect) {
          onMediaSelect(null, false);
        }
      }

      setOpenMenuId(null);
      showToast('Post deleted', 'success');
      if (onMediaDelete) {
        onMediaDelete(mediaId);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      showToast('Failed to delete post', 'error');
    }
  };

  const handleReport = (mediaId) => {
    console.log(`Report post with ID: ${mediaId}`);
    setOpenMenuId(null);
    showToast('Post reported', 'info');
  };

  const handleMute = (mediaId) => {
    console.log(`Mute user for post with ID: ${mediaId}`);
    setOpenMenuId(null);
    showToast('User muted', 'info');
  };

  const handleBlock = (mediaId) => {
    console.log(`Block user for post with ID: ${mediaId}`);
    setOpenMenuId(null);
    showToast('User blocked', 'info');
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
      views: 0,
      mediaItems: [],
    };

    setMedia((prev) => [newQuotePost, ...prev].sort(
      (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
    ));

    setDisplayedMedia((prev) => [newQuotePost, ...prev].sort(
      (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
    ));

    const originalMediaId = quoteData.quotedMedia.id;
    setMedia((prevMedia) =>
      prevMedia.map((item) =>
        item.id === originalMediaId
          ? { ...item, quotePostCount: (item.quotePostCount || 0) + 1 }
          : item
      ).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    );

    setDisplayedMedia((prevMedia) =>
      prevMedia.map((item) =>
        item.id === originalMediaId
          ? { ...item, quotePostCount: (item.quotePostCount || 0) + 1 }
          : item
      ).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    );

    setShowQuoteModal(false);
    setQuoteTargetMedia(null);
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

  if (displayedMedia.length === 0) {
    return (
      <div className={`grid ${compactMode ? 'compact-grid' : ''}`}>
        <p>No media available to display.</p>
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
              className={`grid-item ${selectedMedia?.id === item.id ? 'fullscreen' : ''}`}
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
                        {item.originalPost.mediaItems && item.originalPost.mediaItems.length > 0 ? (
                          <MediaCarousel mediaItems={item.originalPost.mediaItems} />
                        ) : item.originalPost.mediaType === 'photo' ? (
                          <img
                            src={item.originalPost.mediaUrl}
                            alt={item.originalPost.caption}
                            className="quoted-media"
                            width={item.originalPost.width}
                            height={item.originalPost.height}
                          />
                        ) : item.originalPost.mediaType === 'video' ? (
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
                        ) : item.originalPost.mediaType === 'audio' ? (
                          <div className="quoted-media-audio">
                            <FiMic size={24} />
                            <p>{item.originalPost.caption}</p>
                          </div>
                        ) : item.originalPost.mediaType === 'document' ? (
                          <div className="quoted-media-document">
                            <FiFile size={24} />
                            <p>{item.originalPost.caption}</p>
                          </div>
                        ) : item.originalPost.mediaType === 'poll' ? (
                          <div className="quoted-media-poll">
                            <FiBarChart2 size={24} />
                            <p>{item.originalPost.caption}</p>
                          </div>
                        ) : item.originalPost.mediaType === 'text' ? (
                          <div className="quoted-media-text">
                            <FiType size={24} />
                            <p>{item.originalPost.content}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : item.mediaItems && item.mediaItems.length > 0 ? (
                      <MediaCarousel
                        mediaItems={item.mediaItems}
                        onMediaClick={() => handleMediaSelect(item)}
                      />
                    ) : item.mediaType === 'photo' ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.description || item.caption || 'Photo'}
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
                        <p className="text-content">{item.content || 'No content available'}</p>
                      </div>
                    ) : null}
                  </div>

                  <MediaInteraction
                    item={item}
                    currentUser={currentUser}
                    onQuoteClick={() => {
                      setQuoteTargetMedia(item);
                      setShowQuoteModal(true);
                    }}
                    onMediaSelect={handleMediaSelect}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    onMute={handleMute}
                    onBlock={handleBlock}
                    showComments={showComments}
                    setShowComments={setShowComments}
                  />
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
                        {item.originalPost.mediaItems && item.originalPost.mediaItems.length > 0 ? (
                          <MediaCarousel mediaItems={item.originalPost.mediaItems} isFullscreen={true} />
                        ) : item.originalPost.mediaType === 'photo' ? (
                          <img
                            src={item.originalPost.mediaUrl}
                            alt={item.originalPost.caption}
                            className="quoted-media-fullscreen"
                            width={item.originalPost.width}
                            height={item.originalPost.height}
                          />
                        ) : item.originalPost.mediaType === 'video' ? (
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
                        ) : item.originalPost.mediaType === 'audio' ? (
                          <div className="quoted-media-audio">
                            <FiMic size={48} />
                            <audio
                              src={item.originalPost.mediaUrl}
                              controls
                              className="media-content"
                            />
                            <p>{item.originalPost.caption}</p>
                          </div>
                        ) : item.originalPost.mediaType === 'document' ? (
                          <div className="quoted-media-document">
                            <FiFile size={48} />
                            <p>{item.originalPost.caption}</p>
                          </div>
                        ) : item.originalPost.mediaType === 'poll' ? (
                          <div className="quoted-media-poll">
                            <FiBarChart2 size={48} />
                            <h4>{item.originalPost.caption}</h4>
                            {item.originalPost.pollOptions.map((option) => (
                              <div key={option.id} className="poll-option">
                                <span>{option.text}</span>
                                <span>({option.votes} votes)</span>
                              </div>
                            ))}
                          </div>
                        ) : item.originalPost.mediaType === 'text' ? (
                          <div className="quoted-media-text">
                            <FiType size={48} />
                            <p>{item.originalPost.content || 'No content available'}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : item.mediaItems && item.mediaItems.length > 0 ? (
                      <MediaCarousel
                        mediaItems={item.mediaItems}
                        isFullscreen={true}
                      />
                    ) : item.mediaType === 'photo' ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.description || item.caption || 'Photo'}
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
                        <p className="text-content">{item.content || 'No content available'}</p>
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

                  <MediaInteraction
                    item={item}
                    currentUser={currentUser}
                    onQuoteClick={() => {
                      setQuoteTargetMedia(item);
                      setShowQuoteModal(true);
                    }}
                    onMediaSelect={handleMediaSelect}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    onMute={handleMute}
                    onBlock={handleBlock}
                    isFullscreen
                    showComments={showComments}
                    setShowComments={setShowComments}
                  />
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
      uploadDate: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),
      likes: PropTypes.number,
      comments: PropTypes.array,
      commentCount: PropTypes.number,
      views: PropTypes.number,
      quotePostCount: PropTypes.number,
      tags: PropTypes.arrayOf(PropTypes.string),
      trending: PropTypes.bool,
      width: PropTypes.number,
      height: PropTypes.number,
      isQuote: PropTypes.bool,
      originalPost: PropTypes.object,
      originalFile: PropTypes.object,
    })
  ),
  profileUser: PropTypes.string,
  currentUser: PropTypes.string,
  compactMode: PropTypes.bool,
  onMediaSelect: PropTypes.func,
  onMediaDelete: PropTypes.func,
};

MediaPanel.defaultProps = {
  demoMode: false,
  profileMedia: [],
  profileUser: '',
  currentUser: 'current_user',
  compactMode: false,
  onMediaSelect: () => {},
  onMediaDelete: () => {},
}; 