import React, { useEffect, useRef } from 'react';
import { StoryViewerHeader } from './StoryViewerHeader';
import { StoryContent } from './StoryContent';
import { StoryInteraction } from './StoryInteraction';
import { ViewersList } from './ViewersList';
import { ReactionsPopup } from './ReactionsPopup';
import "./StoryViewer.css";

export const StoryViewer = ({
  stories,
  storyViewer,
  currentStoryIndex,
  progress,
  isPlaying,
  showViewers,
  showReactions,
  showDeleteOption,
  setStoryViewer,
  setShowViewers,
  setProgress,
  goToNextStory,
  goToPreviousStory,
  togglePlayPause,
  reactToStory,
  deleteStory,
  toggleDeleteOption,
  currentUserId
}) => {
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const storyViewerRef = useRef(null);

  // Handle story viewing progress
  useEffect(() => {
    if (!storyViewer || !isPlaying) return;

    const duration = storyViewer.duration || 5000;
    const increment = 100 / (duration / 100);
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval.current);
          goToNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(progressInterval.current);
  }, [storyViewer, isPlaying, setProgress, goToNextStory]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!storyViewer) return;
      
      if (e.key === 'ArrowRight') {
        goToNextStory();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousStory();
      } else if (e.key === ' ') {
        togglePlayPause();
      } else if (e.key === 'Escape') {
        setStoryViewer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyViewer, goToNextStory, goToPreviousStory, togglePlayPause, setStoryViewer]);

  // Handle click outside story viewer
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (storyViewerRef.current && !storyViewerRef.current.contains(e.target)) {
        setStoryViewer(null);
      }
    };

    if (storyViewer) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [storyViewer, setStoryViewer]);

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) videoRef.current.play();
    }
  };

  // Format time for video stories
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle delete story
  const handleDeleteStory = () => {
    if (storyViewer && storyViewer.userId === currentUserId) {
      deleteStory(storyViewer.id);
    }
  };

  return (
    <div className="imo-story-viewer-overlay">
      <div className="imo-story-viewer" ref={storyViewerRef}>
        {/* Progress bars for each story in the current user's story */}
        <div className="imo-story-progress-container">
          {stories
            .filter(s => s.hasStory)
            .map((s, idx) => (
              <div key={s.id} className="imo-story-progress-track">
                <div 
                  className={`imo-story-progress ${idx === currentStoryIndex ? 'active' : ''} ${idx < currentStoryIndex ? 'completed' : ''}`}
                  style={{ 
                    width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%',
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
              </div>
            ))}
        </div>
        
        <StoryViewerHeader 
          storyViewer={storyViewer}
          setStoryViewer={setStoryViewer}
          setShowViewers={setShowViewers}
          currentUserId={currentUserId}
          toggleDeleteOption={toggleDeleteOption}
          showDeleteOption={showDeleteOption}
          handleDeleteStory={handleDeleteStory}
        />
        
        <StoryContent 
          storyViewer={storyViewer}
          isPlaying={isPlaying}
          videoRef={videoRef}
          handleVideoLoaded={handleVideoLoaded}
          formatTime={formatTime}
          togglePlayPause={togglePlayPause}
          goToNextStory={goToNextStory}
          goToPreviousStory={goToPreviousStory}
        />
        
        <StoryInteraction 
          reactToStory={reactToStory}
          storyViewer={storyViewer}
          currentUserId={currentUserId}
        />
        
        {showViewers && (
          <ViewersList storyViewer={storyViewer} />
        )}
        
        {showReactions && storyViewer.reactions.length > 0 && (
          <ReactionsPopup storyViewer={storyViewer} />
        )}
      </div>
    </div>
  );
};