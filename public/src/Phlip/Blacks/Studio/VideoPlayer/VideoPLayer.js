import React, { useState } from 'react';
import { Videos } from './Videos';
import "./Videos.css";
import { VideoViewer } from './VideoViewer';

export const VideoPlayer = () => {
  const [videoList, setVideoList] = useState([]);
  const [initialVideoIndex, setInitialVideoIndex] = useState(0);
  const [showVideoBrowser, setShowVideoBrowser] = useState(true);

  const handleVideoSelect = (video, videos) => {
    const selectedIndex = videos.findIndex(v => v.path === video.path);
    setVideoList(videos.map(v => v.path)); // Store only paths
    setInitialVideoIndex(selectedIndex);
    setShowVideoBrowser(false);
  };

  const handleBackToLibrary = () => {
    setShowVideoBrowser(true);
    setVideoList([]);
    setInitialVideoIndex(0);
  };

  const playNextVideo = () => {
    if (initialVideoIndex < videoList.length - 1) {
      setInitialVideoIndex(initialVideoIndex + 1);
    }
  };

  const playPreviousVideo = () => {
    if (initialVideoIndex > 0) {
      setInitialVideoIndex(initialVideoIndex - 1);
    }
  };

  // Default time formatting function
  const defaultFormatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const date = new Date(0);
    date.setSeconds(seconds);
    return seconds >= 3600
      ? date.toISOString().substr(11, 8)
      : date.toISOString().substr(14, 5);
  };

  return (
    <div className="vlc-player-container">
      {showVideoBrowser ? (
        <Videos onVideoSelect={handleVideoSelect} />
      ) : (
        <VideoViewer 
          videoList={videoList}
          initialVideoIndex={initialVideoIndex}
          onBackToLibrary={handleBackToLibrary}
          formatTime={defaultFormatTime} // Pass default formatTime
          onNextVideo={playNextVideo}
          onPreviousVideo={playPreviousVideo}
        />
      )}
    </div>
  );
};