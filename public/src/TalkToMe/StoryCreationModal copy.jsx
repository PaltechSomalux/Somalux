import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FiX, FiChevronLeft, FiChevronRight, FiPlus, FiCheck, 
  FiImage, FiVideo, FiType, FiUsers, FiLock, FiGlobe, 
  FiUser, FiEdit2, FiTrash2, FiPenTool, FiSave 
} from 'react-icons/fi';
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
  // Refs
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  
  // State
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyType, setStoryType] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [textStyle, setTextStyle] = useState({
    color: '#ffffff',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    font: 'Arial, sans-serif',
    fontSize: '24px',
    textAlign: 'center'
  });
  const [customPrivacyUsers, setCustomPrivacyUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [drawingWidth, setDrawingWidth] = useState(5);
  const [currentDrawing, setCurrentDrawing] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextTools, setShowTextTools] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTextTool, setActiveTextTool] = useState('style');

  // Mock users for privacy settings
  const mockUsers = [
    { id: '1', name: 'Alex Johnson', avatar: 'AJ' },
    { id: '2', name: 'Sam Wilson', avatar: 'SW' },
    { id: '3', name: 'Taylor Smith', avatar: 'TS' },
    { id: '4', name: 'Jordan Lee', avatar: 'JL' },
  ];

  // Background options for text stories
  const backgroundOptions = [
    { value: 'linear-gradient(135deg, #667eea, #764ba2)', label: 'Purple' },
    { value: 'linear-gradient(135deg, #f093fb, #f5576c)', label: 'Pink' },
    { value: 'linear-gradient(135deg, #4facfe, #00f2fe)', label: 'Blue' },
    { value: 'linear-gradient(135deg, #43e97b, #38f9d7)', label: 'Green' },
    { value: 'linear-gradient(135deg, #ff9a9e, #fad0c4)', label: 'Peach' },
    { value: '#000000', label: 'Black' },
    { value: '#ffffff', label: 'White' },
  ];

  // Font options
  const fontOptions = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: "'Helvetica Neue', sans-serif", label: 'Helvetica' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Courier New', monospace", label: 'Courier' },
    { value: "'Brush Script MT', cursive", label: 'Brush Script' },
  ];

  // Filter suggested users
  useEffect(() => {
    if (userSearch.trim() === '') {
      setSuggestedUsers([]);
      return;
    }
    
    const filtered = mockUsers.filter(user => 
      user.name.toLowerCase().includes(userSearch.toLowerCase()) &&
      !customPrivacyUsers.some(u => u.id === user.id)
    );
    setSuggestedUsers(filtered);
  }, [userSearch, customPrivacyUsers]);

  // Auto-focus text area when text story is selected
  useEffect(() => {
    if (storyType === 'text' && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [storyType]);

  // Handle file selection
  const handleFileSelect = useCallback((type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const newStory = {
      type,
      file,
      preview: URL.createObjectURL(file),
      privacy: selectedPrivacy,
      customPrivacyUsers: selectedPrivacy === 'custom' ? customPrivacyUsers : [],
      drawings: [],
      createdAt: new Date().toISOString()
    };
    
    setStories(prev => [...prev, newStory]);
    setActiveTab('preview');
    setCurrentStoryIndex(stories.length);
    setStoryType(null);
    e.target.value = ''; // Reset file input
  }, [selectedPrivacy, customPrivacyUsers, stories.length]);

  // Handle text story creation
  const handleTextStory = useCallback(() => {
    if (!textContent.trim()) return;
    
    const newStory = {
      type: 'text',
      content: textContent,
      style: textStyle,
      privacy: selectedPrivacy,
      customPrivacyUsers: selectedPrivacy === 'custom' ? customPrivacyUsers : [],
      createdAt: new Date().toISOString()
    };
    
    setStories(prev => [...prev, newStory]);
    setTextContent('');
    setActiveTab('preview');
    setCurrentStoryIndex(stories.length);
    setShowTextTools(false);
  }, [textContent, textStyle, selectedPrivacy, customPrivacyUsers, stories.length]);

  // Post all stories
  const handlePostStories = useCallback(async () => {
    setIsProcessing(true);
    try {
      await Promise.all(stories.map(story => {
        if (story.type === 'text') {
          textStoryInputRef.current.value = story.content;
          return addStory('text', story.privacy, story.customPrivacyUsers);
        } else {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(story.file);
          if (story.type === 'photo') {
            fileInputRef.current.files = dataTransfer.files;
            return addStory('photo', story.privacy, story.customPrivacyUsers);
          } else {
            videoInputRef.current.files = dataTransfer.files;
            return addStory('video', story.privacy, story.customPrivacyUsers);
          }
        }
      }));
      
      // Reset and close
      setStories([]);
      setShowStoryModal(false);
    } catch (error) {
      console.error("Error posting stories:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [stories, addStory, setShowStoryModal, fileInputRef, videoInputRef, textStoryInputRef]);

  // Remove a story
  const removeStory = useCallback((index) => {
    const updated = [...stories];
    if (updated[index]?.preview) {
      URL.revokeObjectURL(updated[index].preview);
    }
    updated.splice(index, 1);
    setStories(updated);
    
    if (currentStoryIndex >= updated.length && updated.length > 0) {
      setCurrentStoryIndex(updated.length - 1);
    } else if (updated.length === 0) {
      setActiveTab('create');
    }
  }, [stories, currentStoryIndex]);

  // Drawing functionality
  useEffect(() => {
    if (!drawingMode || !canvasRef.current || !stories[currentStoryIndex]?.preview) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const img = new Image();
    img.src = stories[currentStoryIndex].preview;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Redraw existing drawings
      stories[currentStoryIndex].drawings?.forEach(drawing => {
        drawPath(ctx, drawing.points, drawing.color, drawing.width);
      });
    };
    
    // Drawing variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    const startDrawing = (e) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
      setCurrentDrawing([{ x: lastX, y: lastY }]);
    };
    
    const draw = (e) => {
      if (!isDrawing) return;
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      [lastX, lastY] = [e.offsetX, e.offsetY];
      setCurrentDrawing(prev => [...prev, { x: e.offsetX, y: e.offsetY }]);
    };
    
    const stopDrawing = () => {
      if (!isDrawing) return;
      isDrawing = false;
      
      if (currentDrawing.length > 1) {
        const updatedStories = [...stories];
        updatedStories[currentStoryIndex].drawings = [
          ...(updatedStories[currentStoryIndex].drawings || []),
          { points: currentDrawing, color: drawingColor, width: drawingWidth }
        ];
        setStories(updatedStories);
      }
      
      setCurrentDrawing([]);
    };
    
    // Event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [drawingMode, currentStoryIndex, stories, drawingColor, drawingWidth]);

  const drawPath = (ctx, points, color, width) => {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      stories.forEach(story => {
        if (story.preview) {
          URL.revokeObjectURL(story.preview);
        }
      });
    };
  }, [stories]);

  // Navigate between stories
  const navigateStory = useCallback((direction) => {
    if (direction === 'prev' && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (direction === 'next' && currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
  }, [currentStoryIndex, stories.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        navigateStory('prev');
      } else if (e.key === 'ArrowRight') {
        navigateStory('next');
      } else if (e.key === 'Escape') {
        setDrawingMode(false);
        setShowColorPicker(false);
        setShowTextTools(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateStory]);

  // Handle clicks outside color picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColorPicker && !e.target.closest('.sc-color-picker-popup, .sc-color-picker-trigger, .sc-drawing-color-preview')) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  return (
    <div className="sc-modal-overlay">
      <div className="sc-modal">
        {/* Header */}
        <div className="sc-modal-header">
          <button 
            className="sc-close-btn"
            onClick={() => setShowStoryModal(false)}
            disabled={isProcessing}
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
          
          <h2>Create Story</h2>
          
          {stories.length > 0 && (
            <button 
              className="sc-post-btn"
              onClick={handlePostStories}
              disabled={isProcessing}
              aria-label="Post stories"
            >
              {isProcessing ? (
                <span className="sc-spinner"></span>
              ) : (
                'Post'
              )}
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="sc-tabs">
          <button
            className={`sc-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setDrawingMode(false);
            }}
            disabled={isProcessing}
          >
            Create
          </button>
          <button
            className={`sc-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={stories.length === 0 || isProcessing}
          >
            Preview {stories.length > 0 && `(${stories.length})`}
          </button>
        </div>
        
        {/* Content Area */}
        <div className="sc-content">
          {activeTab === 'create' ? (
            <div className="sc-creation-view">
              {/* Story Type Selection */}
              {!storyType && (
                <div className="sc-type-selector">
                  <h3>Create New Story</h3>
                  <p>Choose a story type to get started</p>
                  
                  <div className="sc-type-options">
                    <button 
                      className="sc-type-option"
                      onClick={() => setStoryType('photo')}
                      disabled={isProcessing}
                    >
                      <div className="sc-type-icon">
                        <FiImage size={32} />
                      </div>
                      <span>Photo</span>
                    </button>
                    
                    <button 
                      className="sc-type-option"
                      onClick={() => setStoryType('video')}
                      disabled={isProcessing}
                    >
                      <div className="sc-type-icon">
                        <FiVideo size={32} />
                      </div>
                      <span>Video</span>
                    </button>
                    
                    <button 
                      className="sc-type-option"
                      onClick={() => {
                        setStoryType('text');
                        setShowTextTools(true);
                      }}
                      disabled={isProcessing}
                    >
                      <div className="sc-type-icon">
                        <FiType size={32} />
                      </div>
                      <span>Text</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Photo Story */}
              {storyType === 'photo' && (
                <div className="sc-file-upload">
                  <h3>Add Photo</h3>
                  <p>Select a photo from your device</p>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileSelect('photo', e)}
                    style={{ display: 'none' }}
                  />
                  
                  <div 
                    className="sc-upload-area" 
                    onClick={() => fileInputRef.current.click()}
                    role="button"
                    tabIndex="0"
                  >
                    <FiPlus size={48} className="sc-upload-icon" />
                    <span className="sc-upload-text">Click to select or drag & drop</span>
                    <span className="sc-upload-subtext">JPG, PNG up to 10MB</span>
                  </div>
                </div>
              )}
              
              {/* Video Story */}
              {storyType === 'video' && (
                <div className="sc-file-upload">
                  <h3>Add Video</h3>
                  <p>Select a video from your device</p>
                  
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={(e) => handleFileSelect('video', e)}
                    style={{ display: 'none' }}
                  />
                  
                  <div 
                    className="sc-upload-area" 
                    onClick={() => videoInputRef.current.click()}
                    role="button"
                    tabIndex="0"
                  >
                    <FiPlus size={48} className="sc-upload-icon" />
                    <span className="sc-upload-text">Click to select or drag & drop</span>
                    <span className="sc-upload-subtext">MP4, MOV up to 25MB</span>
                  </div>
                </div>
              )}
              
              {/* Text Story */}
              {storyType === 'text' && (
                <div className="sc-text-story">
                  <div className="sc-text-toolbar">
                    <button 
                      className={`sc-text-tool-btn ${activeTextTool === 'style' ? 'active' : ''}`}
                      onClick={() => setActiveTextTool('style')}
                    >
                      Style
                    </button>
                    <button 
                      className={`sc-text-tool-btn ${activeTextTool === 'background' ? 'active' : ''}`}
                      onClick={() => setActiveTextTool('background')}
                    >
                      Background
                    </button>
                  </div>
                  
                  <div className="sc-text-content">
                    <div 
                      className="sc-text-preview"
                      style={{ 
                        background: textStyle.background,
                        color: textStyle.color,
                        fontFamily: textStyle.font,
                        fontSize: textStyle.fontSize,
                        textAlign: textStyle.textAlign
                      }}
                    >
                      {textContent || 'Type your story here...'}
                    </div>
                    
                    <textarea
                      ref={textAreaRef}
                      placeholder="What's on your mind?"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      maxLength={500}
                      className="sc-text-input"
                    />
                    
                    <div className="sc-text-character-count">
                      {textContent.length}/500
                    </div>
                    
                    {showTextTools && (
                      <div className="sc-text-tools">
                        {activeTextTool === 'style' && (
                          <div className="sc-text-style-tools">
                            <div className="sc-text-style-group">
                              <label>Text Color</label>
                              <div 
                                className="sc-color-picker-trigger" 
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                role="button"
                                tabIndex="0"
                              >
                                <div 
                                  className="sc-color-preview" 
                                  style={{ backgroundColor: textStyle.color }}
                                />
                                <span>{textStyle.color}</span>
                              </div>
                              
                              {showColorPicker && (
                                <div className="sc-color-picker-popup">
                                  <input 
                                    type="color" 
                                    value={textStyle.color}
                                    onChange={(e) => setTextStyle({...textStyle, color: e.target.value})}
                                  />
                                  <button 
                                    className="sc-color-picker-close"
                                    onClick={() => setShowColorPicker(false)}
                                  >
                                    <FiCheck size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className="sc-text-style-group">
                              <label>Font</label>
                              <select
                                value={textStyle.font}
                                onChange={(e) => setTextStyle({...textStyle, font: e.target.value})}
                                className="sc-font-select"
                              >
                                {fontOptions.map(font => (
                                  <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="sc-text-style-group">
                              <label>Size</label>
                              <input
                                type="range"
                                min="16"
                                max="72"
                                value={parseInt(textStyle.fontSize)}
                                onChange={(e) => setTextStyle({...textStyle, fontSize: `${e.target.value}px`})}
                              />
                            </div>
                            
                            <div className="sc-text-style-group">
                              <label>Alignment</label>
                              <div className="sc-text-align-options">
                                <button
                                  className={`sc-align-btn ${textStyle.textAlign === 'left' ? 'active' : ''}`}
                                  onClick={() => setTextStyle({...textStyle, textAlign: 'left'})}
                                >
                                  Left
                                </button>
                                <button
                                  className={`sc-align-btn ${textStyle.textAlign === 'center' ? 'active' : ''}`}
                                  onClick={() => setTextStyle({...textStyle, textAlign: 'center'})}
                                >
                                  Center
                                </button>
                                <button
                                  className={`sc-align-btn ${textStyle.textAlign === 'right' ? 'active' : ''}`}
                                  onClick={() => setTextStyle({...textStyle, textAlign: 'right'})}
                                >
                                  Right
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {activeTextTool === 'background' && (
                          <div className="sc-background-tools">
                            <div className="sc-background-options">
                              {backgroundOptions.map(bg => (
                                <div 
                                  key={bg.value}
                                  className={`sc-background-option ${textStyle.background === bg.value ? 'active' : ''}`}
                                  onClick={() => setTextStyle({...textStyle, background: bg.value})}
                                  style={{ background: bg.value }}
                                  role="button"
                                  tabIndex="0"
                                >
                                  {textStyle.background === bg.value && (
                                    <FiCheck className="sc-bg-check" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="sc-text-actions">
                      <button
                        className="sc-cancel-text-btn"
                        onClick={() => {
                          setStoryType(null);
                          setTextContent('');
                          setShowTextTools(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="sc-add-text-btn"
                        onClick={handleTextStory}
                        disabled={!textContent.trim()}
                      >
                        Add to Story
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Privacy Settings */}
              <div className="sc-privacy-settings">
                <h3>Who can see this?</h3>
                
                <div className="sc-privacy-options">
                  <button
                    className={`sc-privacy-option ${selectedPrivacy === 'public' ? 'active' : ''}`}
                    onClick={() => setSelectedPrivacy('public')}
                  >
                    <div className="sc-privacy-icon">
                      <FiGlobe size={18} />
                    </div>
                    <div className="sc-privacy-info">
                      <span className="sc-privacy-title">Public</span>
                      <span className="sc-privacy-desc">Anyone can see this</span>
                    </div>
                  </button>
                  
                  <button
                    className={`sc-privacy-option ${selectedPrivacy === 'friends' ? 'active' : ''}`}
                    onClick={() => setSelectedPrivacy('friends')}
                  >
                    <div className="sc-privacy-icon">
                      <FiUsers size={18} />
                    </div>
                    <div className="sc-privacy-info">
                      <span className="sc-privacy-title">Friends</span>
                      <span className="sc-privacy-desc">Your friends only</span>
                    </div>
                  </button>
                  
                  <button
                    className={`sc-privacy-option ${selectedPrivacy === 'close_friends' ? 'active' : ''}`}
                    onClick={() => setSelectedPrivacy('close_friends')}
                  >
                    <div className="sc-privacy-icon">
                      <FiUser size={18} />
                    </div>
                    <div className="sc-privacy-info">
                      <span className="sc-privacy-title">Close Friends</span>
                      <span className="sc-privacy-desc">Only your close friends</span>
                    </div>
                  </button>
                  
                  <button
                    className={`sc-privacy-option ${selectedPrivacy === 'custom' ? 'active' : ''}`}
                    onClick={() => setSelectedPrivacy('custom')}
                  >
                    <div className="sc-privacy-icon">
                      <FiLock size={18} />
                    </div>
                    <div className="sc-privacy-info">
                      <span className="sc-privacy-title">Custom</span>
                      <span className="sc-privacy-desc">Specific people only</span>
                    </div>
                  </button>
                </div>
                
                {selectedPrivacy === 'custom' && (
                  <div className="sc-custom-privacy">
                    <div className="sc-user-search-container">
                      <input
                        type="text"
                        placeholder="Search friends..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="sc-user-search-input"
                      />
                      
                      {suggestedUsers.length > 0 && (
                        <div className="sc-user-suggestions">
                          {suggestedUsers.map(user => (
                            <div 
                              key={user.id}
                              className="sc-user-suggestion"
                              onClick={() => {
                                setCustomPrivacyUsers([...customPrivacyUsers, user]);
                                setUserSearch('');
                              }}
                              role="button"
                              tabIndex="0"
                            >
                              <div className="sc-user-avatar">
                                {user.avatar}
                              </div>
                              <span className="sc-user-name">{user.name}</span>
                              <FiPlus className="sc-user-add-icon" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {customPrivacyUsers.length > 0 && (
                      <div className="sc-selected-users">
                        <div className="sc-selected-users-header">
                          <span className="sc-selected-count">{customPrivacyUsers.length} selected</span>
                          {customPrivacyUsers.length > 0 && (
                            <button
                              className="sc-clear-selection"
                              onClick={() => setCustomPrivacyUsers([])}
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        <div className="sc-user-list">
                          {customPrivacyUsers.map(user => (
                            <div key={user.id} className="sc-selected-user">
                              <div className="sc-user-avatar">
                                {user.avatar}
                              </div>
                              <span className="sc-user-name">{user.name}</span>
                              <button
                                className="sc-remove-user"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomPrivacyUsers(
                                    customPrivacyUsers.filter(u => u.id !== user.id)
                                  );
                                }}
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sc-preview-view">
              {stories.length > 0 && (
                <>
                  <div className="sc-story-display-container">
                    {currentStoryIndex > 0 && (
                      <button 
                        className="sc-nav-btn sc-nav-left"
                        onClick={() => navigateStory('prev')}
                        aria-label="Previous story"
                      >
                        <FiChevronLeft size={24} />
                      </button>
                    )}
                    
                    <div className="sc-story-display">
                      {stories[currentStoryIndex].type === 'photo' && (
                        <div className="sc-photo-container">
                          <img 
                            src={stories[currentStoryIndex].preview} 
                            alt="Story preview" 
                            style={{ transform: `scale(${zoomLevel})` }}
                          />
                          {drawingMode && (
                            <>
                              <canvas
                                ref={canvasRef}
                                className="sc-drawing-canvas"
                                style={{ transform: `scale(${zoomLevel})` }}
                              />
                              <div className="sc-drawing-tools">
                                <div className="sc-drawing-color-picker">
                                  <div 
                                    className="sc-drawing-color-preview"
                                    style={{ backgroundColor: drawingColor }}
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    role="button"
                                    tabIndex="0"
                                  />
                                  {showColorPicker && (
                                    <div className="sc-drawing-color-popup">
                                      <input 
                                        type="color" 
                                        value={drawingColor}
                                        onChange={(e) => setDrawingColor(e.target.value)}
                                      />
                                      <button 
                                        className="sc-color-picker-close"
                                        onClick={() => setShowColorPicker(false)}
                                      >
                                        <FiCheck size={18} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="20"
                                  value={drawingWidth}
                                  onChange={(e) => setDrawingWidth(parseInt(e.target.value))}
                                  className="sc-drawing-width-slider"
                                />
                                <button
                                  className="sc-drawing-clear"
                                  onClick={() => {
                                    const updated = [...stories];
                                    updated[currentStoryIndex].drawings = [];
                                    setStories(updated);
                                  }}
                                >
                                  Clear
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      {stories[currentStoryIndex].type === 'video' && (
                        <div className="sc-video-container">
                          <video
                            src={stories[currentStoryIndex].preview}
                            controls
                            autoPlay
                            loop
                            className="sc-video-player"
                          />
                        </div>
                      )}
                      
                      {stories[currentStoryIndex].type === 'text' && (
                        <div 
                          className="sc-text-story-display"
                          style={{ 
                            background: stories[currentStoryIndex].style.background,
                            color: stories[currentStoryIndex].style.color,
                            fontFamily: stories[currentStoryIndex].style.font,
                            fontSize: stories[currentStoryIndex].style.fontSize,
                            textAlign: stories[currentStoryIndex].style.textAlign
                          }}
                        >
                          {stories[currentStoryIndex].content}
                        </div>
                      )}
                      
                      <div className="sc-story-actions">
                        {stories[currentStoryIndex].type === 'photo' && (
                          <button
                            className={`sc-drawing-btn ${drawingMode ? 'active' : ''}`}
                            onClick={() => setDrawingMode(!drawingMode)}
                          >
                            <FiPenTool size={18} />
                            <span>{drawingMode ? 'Done' : 'Draw'}</span>
                          </button>
                        )}
                        
                        <div className="sc-zoom-controls">
                          <button
                            className="sc-zoom-btn"
                            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                            disabled={zoomLevel <= 0.5}
                          >
                            -
                          </button>
                          <span className="sc-zoom-level">{Math.round(zoomLevel * 100)}%</span>
                          <button
                            className="sc-zoom-btn"
                            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                            disabled={zoomLevel >= 2}
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          className="sc-delete-btn"
                          onClick={() => removeStory(currentStoryIndex)}
                        >
                          <FiTrash2 size={18} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    
                    {currentStoryIndex < stories.length - 1 && (
                      <button 
                        className="sc-nav-btn sc-nav-right"
                        onClick={() => navigateStory('next')}
                        aria-label="Next story"
                      >
                        <FiChevronRight size={24} />
                      </button>
                    )}
                  </div>
                  
                  <div className="sc-story-thumbnails">
                    {stories.map((story, index) => (
                      <div
                        key={index}
                        className={`sc-thumbnail ${index === currentStoryIndex ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentStoryIndex(index);
                          setDrawingMode(false);
                        }}
                        role="button"
                        tabIndex="0"
                      >
                        {story.type === 'photo' && (
                          <img src={story.preview} alt="Thumbnail" />
                        )}
                        
                        {story.type === 'video' && (
                          <div className="sc-video-thumbnail">
                            <FiVideo size={16} />
                          </div>
                        )}
                        
                        {story.type === 'text' && (
                          <div 
                            className="sc-text-thumbnail"
                            style={{ background: story.style.background }}
                          >
                            <FiType size={16} />
                          </div>
                        )}
                        
                        <button 
                          className="sc-thumbnail-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStory(index);
                          }}
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                    
                    {stories.length < 10 && (
                      <div
                        className="sc-add-more"
                        onClick={() => {
                          setActiveTab('create');
                          setStoryType(null);
                          setDrawingMode(false);
                        }}
                        role="button"
                        tabIndex="0"
                      >
                        <FiPlus size={24} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};