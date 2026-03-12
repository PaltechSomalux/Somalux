// StoryCreationModal.js
import React, { useState } from 'react';
import "./StoryCreationModal.css";

export const StoryCreationModal = ({
  setShowStoryModal,
  fileInputRef,
  videoInputRef,
  textStoryInputRef,
  selectedPrivacy,
  setSelectedPrivacy,
  addStory
}) => {
  const [stories, setStories] = useState([]);
  const [currentStoryType, setCurrentStoryType] = useState(null);
  const [textContent, setTextContent] = useState('');

  const handleAddStory = () => {
    if (fileInputRef.current?.files[0]) {
      const newStory = {
        type: 'photo',
        file: fileInputRef.current.files[0],
        preview: URL.createObjectURL(fileInputRef.current.files[0])
      };
      setStories([...stories, newStory]);
      fileInputRef.current.value = '';
    } else if (videoInputRef.current?.files[0]) {
      const newStory = {
        type: 'video',
        file: videoInputRef.current.files[0],
        preview: URL.createObjectURL(videoInputRef.current.files[0])
      };
      setStories([...stories, newStory]);
      videoInputRef.current.value = '';
    } else if (textContent.trim()) {
      const newStory = {
        type: 'text',
        content: textContent
      };
      setStories([...stories, newStory]);
      setTextContent('');
    }
  };

  const handlePostAllStories = () => {
    stories.forEach(story => {
      if (story.type === 'text') {
        textStoryInputRef.current.value = story.content;
        addStory('text');
      } else {
        // For photo and video, we need to create a mock file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(story.file);
        if (story.type === 'photo') {
          fileInputRef.current.files = dataTransfer.files;
          addStory('photo');
        } else {
          videoInputRef.current.files = dataTransfer.files;
          addStory('video');
        }
      }
    });
    setShowStoryModal(false);
  };

  const removeStory = (index) => {
    const updatedStories = [...stories];
    updatedStories.splice(index, 1);
    setStories(updatedStories);
  };

  return (
    <div className="imo-story-modal-overlay">
      <div className="imo-story-modal">
        <div className="imo-story-modal-header">
          <h3>Create Story</h3>
          <button 
            className="imo-close-modal"
            onClick={() => setShowStoryModal(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="imo-story-preview-container">
          {stories.length > 0 && (
            <div className="imo-stories-preview">
              <h4>Your Stories ({stories.length})</h4>
              <div className="imo-stories-grid">
                {stories.map((story, index) => (
                  <div key={index} className="imo-story-preview-item">
                    {story.type === 'photo' && (
                      <img src={story.preview} alt="Story preview" />
                    )}
                    {story.type === 'video' && (
                      <video src={story.preview} controls />
                    )}
                    {story.type === 'text' && (
                      <div className="imo-text-preview">{story.content}</div>
                    )}
                    <button 
                      className="imo-remove-story"
                      onClick={() => removeStory(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="imo-story-creation-options">
          <label className="imo-story-option">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={() => {
                if (fileInputRef.current.files[0]) {
                  videoInputRef.current.value = '';
                  setCurrentStoryType('photo');
                }
              }}
            />
            <div className="imo-story-option-icon">📷</div>
            <span>Photo</span>
          </label>
          
          <label className="imo-story-option">
            <input 
              type="file" 
              accept="video/*" 
              ref={videoInputRef}
              onChange={() => {
                if (videoInputRef.current.files[0]) {
                  fileInputRef.current.value = '';
                  setCurrentStoryType('video');
                }
              }}
            />
            <div className="imo-story-option-icon">🎥</div>
            <span>Video</span>
          </label>
          
          <div 
            className="imo-story-option"
            onClick={() => {
              setCurrentStoryType('text');
              fileInputRef.current.value = '';
              videoInputRef.current.value = '';
            }}
          >
            <div className="imo-story-option-icon">✏️</div>
            <span>Text</span>
          </div>
        </div>
        
        {currentStoryType === 'text' && (
          <div className="imo-text-story-input-container">
            <textarea 
              value={textContent}
              placeholder="Type your story text..."
              rows="4"
              onChange={(e) => setTextContent(e.target.value)}
            />
          </div>
        )}
        
        <div className="imo-story-privacy">
          <h4>Privacy</h4>
          <select 
            value={selectedPrivacy}
            onChange={(e) => setSelectedPrivacy(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="close_friends">Close Friends</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div className="imo-story-modal-buttons">
          <button 
            className="imo-cancel-btn" 
            onClick={() => {
              setShowStoryModal(false);
              fileInputRef.current.value = '';
              videoInputRef.current.value = '';
              setTextContent('');
              setStories([]);
            }}
          >
            Discard All
          </button>
          
          <button 
            className="imo-add-btn"
            onClick={handleAddStory}
            disabled={
              !fileInputRef.current?.files[0] && 
              !videoInputRef.current?.files[0] && 
              !textContent.trim()
            }
          >
            Add to Stories
          </button>
          
          {stories.length > 0 && (
            <button 
              className="imo-post-all-btn"
              onClick={handlePostAllStories}
            >
              Post All Stories ({stories.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};