import React, { useState, useEffect } from 'react';
import { VideoViewer2 } from './VideoViewer2';
import './VideoViewer.css'; // Import CSS for no-video-message styling

export const VideoViewer = ({
  videoList = [], // Expect videoList to be an array of strings (URLs) or objects ({ src: string, title: string })
  initialVideoIndex = 0,
  onBackToLibrary,
  formatTime // Custom time formatting function
}) => {
  // Validate initialVideoIndex
  const safeInitialIndex = Math.max(0, Math.min(initialVideoIndex, videoList.length - 1));
  const [currentVideoIndex, setCurrentVideoIndex] = useState(videoList.length > 0 ? safeInitialIndex : 0);
  const [hasNextVideo, setHasNextVideo] = useState(false);
  const [hasPreviousVideo, setHasPreviousVideo] = useState(false);

  // Update hasNext/hasPrevious whenever videoList or currentVideoIndex changes
  useEffect(() => {
    setHasNextVideo(videoList.length > 0 && currentVideoIndex < videoList.length - 1);
    setHasPreviousVideo(videoList.length > 0 && currentVideoIndex > 0);
  }, [videoList, currentVideoIndex]);

  const handleVideoChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < videoList.length) {
      setCurrentVideoIndex(newIndex);
    }
  };

  const playNextVideo = () => {
    if (hasNextVideo) {
      handleVideoChange(currentVideoIndex + 1);
    }
  };

  const playPreviousVideo = () => {
    if (hasPreviousVideo) {
      handleVideoChange(currentVideoIndex - 1);
    }
  };

  // Extract video source and title
  let currentVideoSrc = null;
  let currentVideoTitle = null;

  if (videoList.length > 0) {
    const currentVideo = videoList[currentVideoIndex];
    if (typeof currentVideo === 'string') {
      currentVideoSrc = currentVideo; // videoList is an array of URLs
    } else if (currentVideo && typeof currentVideo === 'object' && currentVideo.src) {
      currentVideoSrc = currentVideo.src; // videoList is an array of objects with src and optional title
      currentVideoTitle = currentVideo.title || null;
    }
  }

  // Render fallback UI if no video is available
  if (!currentVideoSrc) {
    return (
      <div className="no-video-message">
        <p>No video available. Please select a video from the library.</p>
        <button onClick={onBackToLibrary} aria-label="Back to library">
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <VideoViewer2
      videoSrc={currentVideoSrc}
      videoTitle={currentVideoTitle} // Pass videoTitle to VideoViewer2
      onNextVideo={playNextVideo}
      onPreviousVideo={playPreviousVideo}
      hasNextVideo={hasNextVideo}
      hasPreviousVideo={hasPreviousVideo}
      onBackToLibrary={onBackToLibrary}
      formatTime={formatTime}
    />
  );
};