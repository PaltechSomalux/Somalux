import React, { useState, useEffect, useRef } from 'react';
import "./Stories.css";
import { StoriesTopBar } from './StoriesTopBar';
import { StoryViewer } from './StoryViewer';
import { StoryCreationModal } from './StoryCreationModal';

export const Stories = () => {
  // Stories state with IMO-like data
  const [stories, setStories] = useState([
    { 
      id: 2, 
      userId: 'user2',
      username: 'Alex', 
      viewed: false, 
      hasStory: true, 
      avatar: '👨', 
      content: { type: 'photo', url: 'https://imo-im.com/stories/alex.jpg' },
      time: '2 hours ago',
      privacy: 'contacts',
      viewers: [],
      reactions: [],
      duration: 5000
    },
    { 
      id: 3, 
      userId: 'user3',
      username: 'Sarah', 
      viewed: false, 
      hasStory: true, 
      avatar: '👩', 
      content: { type: 'video', url: 'https://imo-im.com/stories/sarah.mp4' },
      time: '5 hours ago',
      privacy: 'public',
      viewers: [],
      reactions: [],
      duration: 15000
    },
    { 
      id: 4, 
      userId: 'user4',
      username: 'Team', 
      viewed: false, 
      hasStory: true, 
      avatar: '🏢', 
      content: { type: 'text', text: 'New features coming soon!' },
      time: '1 day ago',
      privacy: 'public',
      viewers: [],
      reactions: [],
      duration: 5000
    }
  ]);

  // Current user ID
  const currentUserId = 'user1';

  // UI states
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyViewer, setStoryViewer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showViewers, setShowViewers] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState('contacts');
  const [darkMode, setDarkMode] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [showDeleteOption, setShowDeleteOption] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textStoryInputRef = useRef(null);

  // Add story with IMO-specific behavior
  const addStory = (type) => {
    let content = null;
    if (type === 'text') {
      const text = textStoryInputRef.current?.value;
      if (!text) return;
      content = { type: 'text', text, color: '#ffffff', background: '#3498db' };
    } else if (type === 'photo' && fileInputRef.current.files[0]) {
      content = { type: 'photo', url: URL.createObjectURL(fileInputRef.current.files[0]) };
    } else if (type === 'video' && videoInputRef.current.files[0]) {
      content = { type: 'video', url: URL.createObjectURL(videoInputRef.current.files[0]) };
    }
    
    if (content) {
      const newStory = {
        id: Date.now(), // Use timestamp as unique ID
        userId: currentUserId,
        username: 'You',
        viewed: false,
        hasStory: true,
        avatar: '👤',
        content,
        time: 'Just now',
        privacy: selectedPrivacy,
        viewers: [],
        reactions: [],
        duration: type === 'video' ? 15000 : 5000
      };
      
      setStories([newStory, ...stories]);
    }
    setShowStoryModal(false);
  };

  // Delete story
  const deleteStory = (storyId) => {
    setStories(stories.filter(story => story.id !== storyId));
    setShowDeleteOption(false);
    
    // If we're currently viewing the deleted story, close the viewer
    if (storyViewer && storyViewer.id === storyId) {
      setStoryViewer(null);
    }
  };

  // View story with IMO-specific behavior
  const viewStory = (story) => {
    if (story.hasStory) {
      const availableStories = stories.filter(s => s.hasStory);
      const storyIndex = availableStories.findIndex(s => s.id === story.id);
      setCurrentStoryIndex(storyIndex);
      setStoryViewer(story);
      setProgress(0);
      setIsPlaying(true);
      
      if (!story.viewed && story.userId !== currentUserId) {
        setStories(stories.map(s => 
          s.id === story.id ? { 
            ...s, 
            viewed: true,
            viewers: [...s.viewers, 'You'].filter((v, i, a) => a.indexOf(v) === i)
          } : s
        ));
      }
    }
  };

  // React to story with IMO-specific reactions
  const reactToStory = (reaction) => {
    if (storyViewer) {
      const newReaction = { user: 'You', type: reaction };
      
      setStories(stories.map(s => 
        s.id === storyViewer.id ? { 
          ...s, 
          reactions: [...s.reactions, newReaction]
        } : s
      ));
      
      setStoryViewer({
        ...storyViewer,
        reactions: [...storyViewer.reactions, newReaction]
      });
      
      setShowReactions(true);
      setTimeout(() => setShowReactions(false), 2000);
    }
  };

  // Navigation between stories
  const goToNextStory = () => {
    const availableStories = stories.filter(s => s.hasStory);
    if (currentStoryIndex < availableStories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      const nextStory = availableStories[nextIndex];
      setCurrentStoryIndex(nextIndex);
      setStoryViewer(nextStory);
      setProgress(0);
      
      if (!nextStory.viewed && nextStory.userId !== currentUserId) {
        setStories(stories.map(s => 
          s.id === nextStory.id ? { 
            ...s, 
            viewed: true,
            viewers: [...s.viewers, 'You'].filter((v, i, a) => a.indexOf(v) === i)
          } : s
        ));
      }
    } else {
      setStoryViewer(null);
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      const prevStory = stories.filter(s => s.hasStory)[prevIndex];
      setCurrentStoryIndex(prevIndex);
      setStoryViewer(prevStory);
      setProgress(0);
    }
  };

  // Toggle play/pause for video stories
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Toggle delete option visibility
  const toggleDeleteOption = () => {
    setShowDeleteOption(prev => !prev);
  };

  return (
    <div className={`imo-stories-app ${darkMode ? 'dark-mode' : ''}`}>
      <StoriesTopBar 
        stories={stories}
        viewStory={viewStory}
        setShowStoryModal={setShowStoryModal}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onlineStatus={onlineStatus}
        setOnlineStatus={setOnlineStatus}
        currentUserId={currentUserId}
      />
      
      {storyViewer && (
        <StoryViewer 
          stories={stories.filter(s => s.hasStory)}
          storyViewer={storyViewer}
          currentStoryIndex={currentStoryIndex}
          progress={progress}
          isPlaying={isPlaying}
          showViewers={showViewers}
          showReactions={showReactions}
          showDeleteOption={showDeleteOption}
          setStoryViewer={setStoryViewer}
          setShowViewers={setShowViewers}
          setProgress={setProgress}
          goToNextStory={goToNextStory}
          goToPreviousStory={goToPreviousStory}
          togglePlayPause={togglePlayPause}
          reactToStory={reactToStory}
          deleteStory={deleteStory}
          toggleDeleteOption={toggleDeleteOption}
          currentUserId={currentUserId}
        />
      )}
      
      {showStoryModal && (
        <StoryCreationModal 
          setShowStoryModal={setShowStoryModal}
          fileInputRef={fileInputRef}
          videoInputRef={videoInputRef}
          textStoryInputRef={textStoryInputRef}
          selectedPrivacy={selectedPrivacy}
          setSelectedPrivacy={setSelectedPrivacy}
          addStory={addStory}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};