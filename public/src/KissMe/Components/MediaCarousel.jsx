// src/KissMe/Components/MediaCarousel.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiChevronLeft, FiChevronRight, FiPlay, FiMic, FiFile } from 'react-icons/fi';
import './MediaPanel.css';

export const MediaCarousel = ({ mediaItems, isFullscreen = false, onMediaClick = null }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const nextMedia = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < mediaItems.length - 1) {
      nextMedia();
    }
    if (isRightSwipe && currentIndex > 0) {
      prevMedia();
    }
  };

  const currentMedia = mediaItems[currentIndex];
  const hasMultipleMedia = mediaItems.length > 1;

  return (
    <div
      className={`media-carousel ${isFullscreen ? 'fullscreen-carousel' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onMediaClick}
    >
      <div className="carousel-content">
        {currentMedia.mediaType === 'photo' ? (
          <img
            src={currentMedia.mediaUrl}
            alt={currentMedia.caption || currentMedia.description || 'Photo'}
            className={`media-content ${isFullscreen ? 'media-content-fullscreen' : ''}`}
            width={currentMedia.width}
            height={currentMedia.height}
            onError={(e) => {
              console.error('Image load error:', e);
              e.target.style.display = 'none';
            }}
          />
        ) : currentMedia.mediaType === 'video' ? (
          <div className="media-video">
            <video
              src={currentMedia.mediaUrl}
              className={`media-content ${isFullscreen ? 'media-content-fullscreen' : ''}`}
              controls={isFullscreen}
              muted={!isFullscreen}
              autoPlay={isFullscreen}
              width={currentMedia.width}
              height={currentMedia.height}
              onError={(e) => {
                console.error('Video load error:', e);
              }}
            />
            {!isFullscreen && <FiPlay className="video-play-icon" />}
          </div>
        ) : currentMedia.mediaType === 'audio' ? (
          <div className="media-audio">
            <FiMic size={isFullscreen ? 48 : 40} />
            {isFullscreen && (
              <audio
                src={currentMedia.mediaUrl}
                controls
                className="media-content"
                onError={(e) => {
                  console.error('Audio load error:', e);
                }}
              />
            )}
            <p>{currentMedia.caption}</p>
          </div>
        ) : currentMedia.mediaType === 'document' ? (
          <div className="media-document">
            <FiFile size={isFullscreen ? 48 : 40} />
            <div className="document-info">
              <p className="document-name">{currentMedia.caption}</p>
              {currentMedia.originalFile && (
                <p className="document-details">
                  {currentMedia.originalFile.type} • {Math.round(currentMedia.originalFile.size / 1024)}KB
                </p>
              )}
              {isFullscreen && (currentMedia.mediaUrl.startsWith('blob:') || currentMedia.mediaUrl.startsWith('data:')) ? (
                <a
                  href={currentMedia.mediaUrl}
                  download={currentMedia.originalFile?.name || currentMedia.caption}
                  className="document-download-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
              ) : isFullscreen && (
                <a
                  href={currentMedia.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="document-view-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </a>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {hasMultipleMedia && (
        <>
          <div className="carousel-indicators">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                aria-label={`View media ${index + 1}`}
              />
            ))}
          </div>

          <div className="carousel-counter">
            {currentIndex + 1} / {mediaItems.length}
          </div>

          {currentIndex > 0 && (
            <button
              className="carousel-nav prev-btn"
              onClick={prevMedia}
              aria-label="Previous media"
            >
              <FiChevronLeft size={24} />
            </button>
          )}

          {currentIndex < mediaItems.length - 1 && (
            <button
              className="carousel-nav next-btn"
              onClick={nextMedia}
              aria-label="Next media"
            >
              <FiChevronRight size={24} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

MediaCarousel.propTypes = {
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
  ).isRequired,
  isFullscreen: PropTypes.bool,
  onMediaClick: PropTypes.func,
};

MediaCarousel.defaultProps = {
  isFullscreen: false,
  onMediaClick: null,
};