import React, { useState } from 'react';
import { 
  Play, Pause, X, Maximize, Camera, VideoCamera,
  CaretLeft, CaretRight, Image as ImageIcon
} from 'phosphor-react';
import './VirtualTour.css';

export const VirtualTour = ({ images, videoUrl, title, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasImages = images && images.length > 0;
  const hasVideo = !!videoUrl;

  const nextImage = () => {
    if (hasImages) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('virtual-tour-modal');
    
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  const startAutoPlay = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === images.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
  };

  const stopAutoPlay = () => {
    setIsPlaying(false);
  };

  return (
    <div className="virtual-tour-overlay" id="virtual-tour-modal">
      <div className="virtual-tour-container">
        {/* Header */}
        <div className="tour-header">
          <div className="tour-title">
            <Camera size={24} weight="duotone" />
            <h3>{title}</h3>
          </div>
          
          <div className="tour-actions">
            {hasVideo && (
              <button
                className="tour-btn"
                onClick={() => setShowVideo(!showVideo)}
                title={showVideo ? 'Show Photos' : 'Show Video'}
              >
                {showVideo ? <ImageIcon size={20} /> : <VideoCamera size={20} />}
              </button>
            )}
            
            <button
              className="tour-btn"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              <Maximize size={20} />
            </button>
            
            <button
              className="tour-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="tour-content">
          {showVideo && hasVideo ? (
            // Video Player
            <div className="video-container">
              <iframe
                src={videoUrl}
                title="Property Video Tour"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            // Image Gallery
            hasImages && (
              <div className="image-viewer">
                <img
                  src={images[currentIndex]}
                  alt={`${title} - Image ${currentIndex + 1}`}
                  className="main-image"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button className="nav-arrow prev" onClick={prevImage}>
                      <CaretLeft size={32} weight="bold" />
                    </button>
                    <button className="nav-arrow next" onClick={nextImage}>
                      <CaretRight size={32} weight="bold" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="image-counter">
                  {currentIndex + 1} / {images.length}
                </div>

                {/* Auto-play Controls */}
                {images.length > 1 && (
                  <button
                    className="autoplay-btn"
                    onClick={isPlaying ? stopAutoPlay : startAutoPlay}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={16} weight="fill" />
                        Stop Slideshow
                      </>
                    ) : (
                      <>
                        <Play size={16} weight="fill" />
                        Start Slideshow
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {/* Thumbnail Strip */}
        {!showVideo && hasImages && images.length > 1 && (
          <div className="thumbnail-strip">
            {images.map((img, index) => (
              <button
                key={index}
                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                <img src={img} alt={`Thumbnail ${index + 1}`} />
                {index === currentIndex && <div className="active-indicator"></div>}
              </button>
            ))}
          </div>
        )}

        {/* Info Panel */}
        <div className="tour-info-panel">
          <div className="info-item">
            <ImageIcon size={18} />
            <span>{images?.length || 0} Photos</span>
          </div>
          {hasVideo && (
            <div className="info-item">
              <VideoCamera size={18} />
              <span>Video Tour Available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Virtual Tour Button Component (to trigger the modal)
export const VirtualTourButton = ({ images, videoUrl, title }) => {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <button className="virtual-tour-trigger" onClick={() => setShowTour(true)}>
        <Camera size={20} weight="duotone" />
        <span>Virtual Tour</span>
        {videoUrl && <span className="video-badge">Video</span>}
      </button>

      {showTour && (
        <VirtualTour
          images={images}
          videoUrl={videoUrl}
          title={title}
          onClose={() => setShowTour(false)}
        />
      )}
    </>
  );
};
