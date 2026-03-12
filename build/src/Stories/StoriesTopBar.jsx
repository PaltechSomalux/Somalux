import React from 'react';
import "./StoriesTopBar.css";

export const StoriesTopBar = ({ 
  stories, 
  viewStory, 
  setShowStoryModal, 
  darkMode, 
  toggleDarkMode, 
  onlineStatus, 
  setOnlineStatus,
  currentUserId
}) => {
  // Group stories by user
  const userStoriesMap = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {});

  // Get the latest story for each user
  const userStories = Object.entries(userStoriesMap).map(([userId, userStories]) => {
    // Sort by time (newest first) and get the first one
    const latestStory = [...userStories].sort((a, b) => new Date(b.time) - new Date(a.time))[0];
    return {
      ...latestStory,
      storyCount: userStories.length,
      hasUnviewed: userStories.some(s => !s.viewed && s.userId !== currentUserId)
    };
  });

  // Separate current user's stories from others
  const currentUserStories = userStories.filter(story => story.userId === currentUserId);
  const otherUserStories = userStories.filter(story => story.userId !== currentUserId);

  return (
    <div className="imo-top-bar">
      <div className="imo-top-left">
        <div className="imo-stories">
        
          <div 
            className="imo-story"
            onClick={() => setShowStoryModal(true)}
          >
            <div className="imo-story-circle imo-add-story-circle">
              <span className="imo-add-story-icon">📷</span>
              <div className="imo-add-story-plus">+</div>
            </div>
            <span className="imo-story-username">Add Story</span>
          </div>

          {/* Current user's stories (viewable by others) */}
          {currentUserStories.map(story => (
            <div 
              key={story.id} 
              className={`imo-story ${story.hasStory ? (story.viewed ? 'viewed' : 'unviewed') : 'no-story'}`}
              onClick={() => viewStory(story)}
            >
              <div className="imo-story-circle">
                <span className="imo-avatar">{story.avatar}</span>
                {story.storyCount > 1 && (
                  <span className="imo-story-count">{story.storyCount}</span>
                )}
              </div>
              <span className="imo-story-username">{story.username}</span>
            </div>
          ))}

          {/* Other users' stories */}
          {otherUserStories.map(story => (
            <div 
              key={story.id} 
              className={`imo-story ${story.hasStory ? (story.hasUnviewed ? 'unviewed' : 'viewed') : 'no-story'}`}
              onClick={() => viewStory(story)}
            >
              <div className="imo-story-circle">
                <span className="imo-avatar">{story.avatar}</span>
                {story.storyCount > 1 && (
                  <span className="imo-story-count">{story.storyCount}</span>
                )}
              </div>
              <span className="imo-story-username">{story.username}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="imo-top-right">
        <span className="imo-planet">Stories</span>
      </div>
    </div>
  );
};