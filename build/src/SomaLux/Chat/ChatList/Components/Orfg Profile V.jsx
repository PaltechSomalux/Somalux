import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiDownload, FiShare2, FiArrowLeft, FiFile, FiMic, FiType, FiImage, FiVideo, FiUser, FiMail, FiPhone, FiLink, FiChevronLeft, FiChevronRight, FiLock, FiUnlock } from 'react-icons/fi';
import { MediaPanel } from './MediaPanel';
import { FloatingActionButton } from './FABProfile';
import './ProfileViewer.css';

// Utility functions for localStorage
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

const readFileWithFallback = (file, modalType) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 3;

    const tryReadFile = (readMethod) => {
      return new Promise((resolveRead, rejectRead) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const result = {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            modalType,
          };

          if (readMethod === 'text') {
            result.content = event.target.result;
          } else if (readMethod === 'dataURL') {
            result.dataUrl = event.target.result;
          } else {
            result.arrayBuffer = event.target.result;
          }

          resolveRead(result);
        };

        reader.onerror = () => {
          rejectRead(new Error(`FileReader error (${readMethod}): ${reader.error?.message || 'Unknown error'}`));
        };

        reader.onabort = () => {
          rejectRead(new Error(`FileReader aborted (${readMethod})`));
        };

        const timeout = setTimeout(() => {
          reader.abort();
          rejectRead(new Error(`FileReader timeout (${readMethod})`));
        }, 30000);

        reader.addEventListener('loadend', () => {
          clearTimeout(timeout);
        });

        try {
          if (readMethod === 'text' && (
            file.type.startsWith('text/') || 
            file.type === 'application/json' ||
            file.type.includes('xml')
          )) {
            reader.readAsText(file);
          } else if (readMethod === 'dataURL' && (
            file.type.startsWith('image/') || 
            file.type.startsWith('video/') || 
            file.type.startsWith('audio/')
          )) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsArrayBuffer(file);
          }
        } catch (error) {
          clearTimeout(timeout);
          rejectRead(error);
        }
      });
    };

    const attemptRead = async () => {
      attempts++;
      let lastError;

      const strategies = [];
      if (file.type.startsWith('text/') || file.type === 'application/json' || file.type.includes('xml')) {
        strategies.push('text');
      }
      if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        strategies.push('dataURL');
      }
      strategies.push('arrayBuffer');

      for (const strategy of strategies) {
        try {
          const result = await tryReadFile(strategy);
          resolve(result);
          return;
        } catch (error) {
          console.warn(`Reading strategy ${strategy} failed for ${file.name}:`, error);
          lastError = error;
        }
      }

      if (attempts < maxAttempts) {
        console.log(`Retrying file read for ${file.name}, attempt ${attempts + 1}/${maxAttempts}`);
        setTimeout(attemptRead, 1000 * attempts);
      } else {
        reject(lastError || new Error(`Failed to read ${file.name} after ${maxAttempts} attempts`));
      }
    };

    attemptRead();
  });
};

export const ProfileViewer = ({
  profile,
  onClose,
  onToggleMute,
  onToggleFollow,
  onToggleBlock,
  onReport,
}) => {
  const [showAvatarFullscreen, setShowAvatarFullscreen] = useState(false);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [isPadlockOpen, setIsPadlockOpen] = useState(loadFromLocalStorage(`padlock_${profile.id}`, false));
  const [activeTab, setActiveTab] = useState(
    loadFromLocalStorage(`activeTab_${profile.id}`, 'posts')
  );
  const [uploadedMedia, setUploadedMedia] = useState(
    loadFromLocalStorage(`uploadedMedia_${profile.id}`, [])
  );
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [isMediaFullscreen, setIsMediaFullscreen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const tabContainerRef = useRef(null);
  const gridRef = useRef(null);
  const profileViewerRef = useRef(null); // Ref for the overlay container

  const isSelfChat = profile?.id === 'yourself';

  // Persist states to localStorage
  useEffect(() => {
    saveToLocalStorage(`activeTab_${profile.id}`, activeTab);
  }, [activeTab, profile.id]);

  useEffect(() => {
    saveToLocalStorage(`padlock_${profile.id}`, isPadlockOpen);
  }, [isPadlockOpen, profile.id]);

  useEffect(() => {
    saveToLocalStorage(`uploadedMedia_${profile.id}`, uploadedMedia);
  }, [uploadedMedia, profile.id]);

  // Ensure profile header is at the top on mount
  useEffect(() => {
    if (profileViewerRef.current) {
      profileViewerRef.current.scrollTop = 0; // Scroll to top on mount
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside for profile actions menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setShowProfileActions(false);
      }
    };

    if (showProfileActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileActions]);

  // Scroll active tab into view only when activeTab changes
  useEffect(() => {
    if (tabContainerRef.current && activeTab !== loadFromLocalStorage(`activeTab_${profile.id}`, 'posts')) {
      const activeTabElement = tabContainerRef.current.querySelector('.chatme-tab-button.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
        });
      }
    }
  }, [activeTab, profile.id]);

  // Handle grid navigation
  const scrollGrid = (direction) => {
    if (gridRef.current) {
      const scrollAmount = gridRef.current.clientWidth * 0.5;
      gridRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle media selection
  const handleMediaSelect = (media, isFullscreenMode) => {
    setIsMediaFullscreen(isFullscreenMode);
  };

  // Handle padlock toggle
  const handlePadlockToggle = () => {
    setIsPadlockOpen((prev) => !prev);
  };

  // Handle media deletion
  const handleMediaDelete = (mediaId) => {
    setUploadedMedia((prev) => prev.filter((item) => item.id !== mediaId));
  };

  const tabs = ['posts', 'following', 'mass', 'comments', 'likes', 'bookmarks'];

  const generateDefaultAvatar = (name = profile.name) => {
    const initials = name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase()
      : 'US';
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      initials
    )}&background=${randomColor}&color=fff&size=256&rounded=true&bold=true`;
  };

  const handleDownloadAvatar = () => {
    const link = document.createElement('a');
    link.href = profile.profilePicture || generateDefaultAvatar();
    link.download = `${profile.name.replace(/\s+/g, '_')}_avatar.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareAvatar = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `${profile.name}'s Profile Picture`,
          text: `Check out ${profile.name}'s profile picture`,
          url: profile.profilePicture || generateDefaultAvatar(),
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          throw new Error('Cannot share this content');
        }
      } else {
        await navigator.clipboard.writeText(
          profile.profilePicture || generateDefaultAvatar()
        );
        alert('Avatar URL copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      try {
        await navigator.clipboard.writeText(
          profile.profilePicture || generateDefaultAvatar()
        );
        alert('Avatar URL copied to clipboard!');
      } catch (clipboardErr) {
        console.error('Clipboard error:', clipboardErr);
        alert('Unable to share or copy URL');
      }
    }
  };

  // Process file content
  const processFileContent = async (file, fileContent, modalType) => {
    return new Promise((resolve, reject) => {
      try {
        let mediaType;
        let processedContent = null;
        let additionalData = {};

        switch (modalType) {
          case 'camera':
            mediaType = file.type.startsWith('image/') ? 'photo' : 'video';
            break;
          case 'image':
            mediaType = 'photo';
            break;
          case 'video':
            mediaType = 'video';
            break;
          case 'audio':
            mediaType = 'audio';
            break;
          case 'document':
            mediaType = 'document';
            break;
          case 'mixed':
            mediaType = file.type.startsWith('image/') ? 'photo' :
                        file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' :
                        'document';
            break;
          default:
            mediaType = 'photo';
        }

        if (fileContent.dataUrl) {
          processedContent = fileContent.dataUrl;
        } else if (fileContent.content) {
          processedContent = fileContent.content;
          additionalData.textContent = fileContent.content;
        } else if (fileContent.arrayBuffer) {
          const blob = new Blob([fileContent.arrayBuffer], { type: file.type });
          processedContent = URL.createObjectURL(blob);
          additionalData.blobUrl = processedContent;
        } else {
          processedContent = URL.createObjectURL(file);
          additionalData.blobUrl = processedContent;
        }

        const newMedia = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          mediaUrl: processedContent,
          mediaType,
          caption: fileContent.name || file.name,
          description: `${modalType} uploaded from ${profile.name}`,
          user: profile.name,
          userId: profile.id,
          uploadDate: new Date().toISOString(),
          likes: 0,
          comments: [],
          commentCount: 0,
          views: 0,
          width: 1000,
          height: 1000,
          originalFile: {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          },
          ...additionalData,
        };

        resolve(newMedia);
      } catch (error) {
        reject(new Error(`Failed to process ${file.name}: ${error.message}`));
      }
    });
  };

  // Handle media creation
  const handleMediaCreate = async (files, description, modalType, fileContents = []) => {
    console.log(`handleMediaCreate (${modalType}):`, files.length, 'files', description);

    if (!files || files.length === 0) {
      console.error('No files provided');
      setUploadErrors(prev => ({
        ...prev,
        [`upload-${Date.now()}`]: ['No files provided'],
      }));
      return;
    }

    const uploadId = `upload-${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [uploadId]: { total: files.length, completed: 0 } }));
    setUploadErrors(prev => ({ ...prev, [uploadId]: [] }));

    const processedMedia = [];
    const errors = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileContent = fileContents[i] || (await readFileWithFallback(file, modalType));

        try {
          console.log(`Processing file ${i + 1}/${files.length}:`, file.name, file.type);
          const newMedia = await processFileContent(file, fileContent, modalType);

          if (description) {
            newMedia.description = description;
            newMedia.caption = description;
          }

          processedMedia.push(newMedia);

          setUploadProgress(prev => ({
            ...prev,
            [uploadId]: { ...prev[uploadId], completed: prev[uploadId].completed + 1 },
          }));

          console.log(`Successfully processed ${file.name}:`, newMedia);
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          errors.push(`${file.name}: ${fileError.message}`);
          setUploadErrors(prev => ({
            ...prev,
            [uploadId]: [...(prev[uploadId] || []), `${file.name}: ${fileError.message}`],
          }));
        }
      }

      if (processedMedia.length > 0) {
        setUploadedMedia(prev => [...prev, ...processedMedia]);
        console.log(`Added ${processedMedia.length} media items successfully`);
      }

      if (errors.length > 0) {
        setUploadErrors(prev => ({
          ...prev,
          [uploadId]: errors,
        }));
      }

      processingTimeoutRef.current = setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });
        setUploadErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[uploadId];
          return newErrors;
        });
      }, 5000);
    } catch (error) {
      console.error('Error in handleMediaCreate:', error);
      setUploadErrors(prev => ({
        ...prev,
        [uploadId]: [...(prev[uploadId] || []), `General error: ${error.message}`],
      }));
    }
  };

  // Handle poll creation
  const handlePollCreate = (options, description) => {
    console.log('handlePollCreate:', options, description);
    const newMedia = {
      id: `poll-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      mediaType: 'poll',
      caption: description || `Poll by ${profile.name}`,
      description: description || '',
      user: profile.name,
      userId: profile.id,
      uploadDate: new Date().toISOString(),
      likes: 0,
      comments: [],
      commentCount: 0,
      views: 0,
      pollOptions: options.map((option, index) => ({
        id: `option-${index}`,
        text: option,
        votes: Math.floor(Math.random() * 50),
      })),
    };
    console.log('New poll added:', newMedia);
    setUploadedMedia((prev) => [...prev, newMedia]);
  };

  // Handle text creation
  const handleTextCreate = async (text, files = []) => {
    console.log('handleTextCreate:', text, files.length, 'files');

    if (files.length > 0) {
      await handleMediaCreate(files, text, 'mixed');
    } else {
      const newMedia = {
        id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        mediaType: 'text',
        caption: text || `Text post by ${profile.name}`,
        description: text || '',
        content: text,
        user: profile.name,
        userId: profile.id,
        uploadDate: new Date().toISOString(),
        likes: Math.floor(Math.random() * 100),
        comments: [],
        commentCount: 0,
        views: Math.floor(Math.random() * 500) + 50,
        width: 1000,
        height: 1000,
      };
      console.log('New text post added:', newMedia);
      setUploadedMedia((prev) => [...prev, newMedia]);
    }
  };

  // Transform profile media
  const transformProfileMedia = () => {
    const originalMedia = profile.media || [];
    const combinedMedia = [...originalMedia, ...uploadedMedia].map((item) => ({
      id: item.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      mediaUrl: item.url || item.mediaUrl,
      mediaType: item.type || item.mediaType || 'photo',
      caption: item.caption || `Media from ${profile.name}`,
      description: item.description || '',
      content: item.content || '',
      pollOptions: item.pollOptions || [],
      user: profile.name,
      userId: profile.id,
      uploadDate: item.createdAt || item.uploadDate || new Date().toISOString(),
      likes: item.likes || Math.floor(Math.random() * 200),
      comments: item.comments || [],
      commentCount: item.commentCount || (item.comments || []).length,
      views: item.views || Math.floor(Math.random() * 1000) + 100,
      tags: item.tags || [],
      trending: item.trending || false,
      width: item.width || 1000,
      height: item.height || 1000,
      originalFile: item.originalFile,
    }));
    console.log('Transformed profile media:', combinedMedia);
    return combinedMedia;
  };

  // Render profile details
  const renderProfileDetails = () => {
    if (!isPadlockOpen) {
      return (
        <div className="chatme-padlock-container">
          <button
            className="chatme-padlock-button"
            onClick={handlePadlockToggle}
            aria-label="Toggle profile details"
          >
            <FiLock size={20} />
          </button>
        </div>
      );
    }

    const details = [
      {
        key: 'bio',
        icon: <FiUser />,
        label: 'Bio',
        content: profile.bio || 'No bio provided.',
      },
      {
        key: 'email',
        icon: <FiMail />,
        label: 'Email',
        content: profile.email || 'No email provided.',
      },
      {
        key: 'phone',
        icon: <FiPhone />,
        label: 'Phone',
        content: profile.phone || 'No phone number provided.',
      },
      {
        key: 'links',
        icon: <FiLink />,
        label: 'Links',
        content: profile.links && profile.links.length > 0 ? (
          <ul className="chatme-links-list">
            {profile.links.map((link, index) => (
              <li key={index}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chatme-link-item"
                >
                  {link.title || link.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          'No links provided.'
        ),
      },
    ];

    return (
      <div className="chatme-profile-details-wrapper">
        <button
          className="chatme-padlock-button"
          onClick={handlePadlockToggle}
          aria-label="Toggle profile details"
        >
          <FiUnlock size={20} />
        </button>
        <button
          className="chatme-profile-details-nav chatme-profile-details-nav-left"
          onClick={() => scrollGrid('left')}
          aria-label="Slide left"
        >
          <FiChevronLeft size={24} />
        </button>
        <div className="chatme-profile-details-container" ref={gridRef}>
          {details.map((detail, index) => (
            <div
              key={detail.key}
              className={`chatme-profile-detail-card ${!profile[detail.key] || (detail.key === 'links' && (!profile.links || profile.links.length === 0)) ? 'chatme-profile-detail-card-empty' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="chatme-profile-detail-header">
                <div className="chatme-profile-detail-icon">{detail.icon}</div>
                <h4>{detail.label}</h4>
              </div>
              <div className="chatme-profile-detail-content">
                {detail.content}
              </div>
            </div>
          ))}
        </div>
        <button
          className="chatme-profile-details-nav chatme-profile-details-nav-right"
          onClick={() => scrollGrid('right')}
          aria-label="Slide right"
        >
          <FiChevronRight size={24} />
        </button>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        const profileMedia = transformProfileMedia();
        const hasMediaData = profileMedia && profileMedia.length > 0;
        return (
          <div className="chatme-tab-content">
            <div className="chatme-profile-media-panel">
              <MediaPanel
                demoMode={!hasMediaData}
                profileMedia={hasMediaData ? profileMedia : undefined}
                profileUser={profile.name}
                currentUser={profile.id}
                compactMode={true}
                key={`${profileMedia.length}-${Date.now()}`}
                onMediaSelect={handleMediaSelect}
                onMediaDelete={handleMediaDelete}
              />
            </div>
          </div>
        );
      case 'following':
      case 'mass':
      case 'comments':
      case 'likes':
      case 'bookmarks':
        return (
          <div className="chatme-tab-content">
            <p className="chatme-profile-detail-text">No content available.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {showAvatarFullscreen && (
        <div
          className="chatme-avatar-fullscreen-overlay"
          onClick={() => setShowAvatarFullscreen(false)}
        >
          <div
            className="chatme-avatar-fullscreen-container"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profile.profilePicture || generateDefaultAvatar()}
              alt={profile.name}
              className="chatme-avatar-fullscreen-image"
              onError={(e) => {
                e.target.src = generateDefaultAvatar();
              }}
            />
            <div className="chatme-avatar-fullscreen-footer">
              <h3>{isSelfChat ? 'You' : profile.name}</h3>
              <p>{profile.bio || 'No bio available'}</p>
              <div className="chatme-avatar-actions">
                <button
                  className="chatme-avatar-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAvatar();
                  }}
                  aria-label="Download avatar"
                >
                  <FiDownload size={20} />
                  <span>Save</span>
                </button>
                <button
                  className="chatme-avatar-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareAvatar();
                  }}
                  aria-label="Share avatar"
                >
                  <FiShare2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>
            <button
              className="chatme-avatar-close-button"
              onClick={() => setShowAvatarFullscreen(false)}
              aria-label="Close avatar view"
            >
              <FiArrowLeft size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="chatme-profile-viewer-overlay" ref={profileViewerRef}>
        <div className="chatme-profile-viewer-header">
          <button
            className="chatme-close-button"
            onClick={onClose}
            aria-label="Close profile"
          >
            <FiArrowLeft size={24} />
          </button>
          <div className="chatme-header-title">
            <h2>Profile</h2>
          </div>
          {!isSelfChat && (
            <button
              className="chatme-profile-actions-button"
              ref={menuButtonRef}
              onClick={() => setShowProfileActions((prev) => !prev)}
              aria-label="Profile actions"
            >
              ⋮
            </button>
          )}
          {isSelfChat && <div className="chatme-profile-actions-placeholder"></div>}
          {!isSelfChat && showProfileActions && (
            <div className="chatme-profile-actions-menu" ref={menuRef}>
              <button
                onClick={() => {
                  onToggleFollow();
                  setShowProfileActions(false);
                }}
              >
                {profile.isFollowed ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={() => {
                  onToggleMute();
                  setShowProfileActions(false);
                }}
              >
                {profile.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={() => {
                  onToggleBlock();
                  setShowProfileActions(false);
                }}
              >
                {profile.isBlocked ? 'Unblock' : 'Block'}
              </button>
              <button
                onClick={() => {
                  onReport();
                  setShowProfileActions(false);
                }}
              >
                Report
              </button>
            </div>
          )}
        </div>

        <div className="chatme-profile-content">
          <div
            className="chatme-profile-image-container"
            onClick={() => setShowAvatarFullscreen(true)}
            role="button"
            aria-label="View profile picture"
            tabIndex={0}
          >
            <img
              src={profile.profilePicture || generateDefaultAvatar()}
              alt={profile.name}
              className="chatme-profile-image"
              onError={(e) => {
                e.target.src = generateDefaultAvatar();
              }}
            />
            {!isSelfChat && profile.isOnline && (
              <div className="chatme-profile-online-indicator">
                <span className="chatme-online-dot"></span>
                <span className="chatme-online-text">Online</span>
              </div>
            )}
          </div>

          <div className="chatme-profile-info">
            <h2>{isSelfChat ? 'You' : profile.name}</h2>
            <div className="chatme-profile-stats">
              <span>
                <strong>{(profile.media?.length || 0) + uploadedMedia.length}</strong> Posts
              </span>
              <span>
                <strong>{profile.followers?.length || 0}</strong> Followers
              </span>
              <span>
                <strong>{profile.following?.length || 0}</strong> Following
              </span>
            </div>
            {renderProfileDetails()}
            <div className="chatme-profile-tabs" ref={tabContainerRef}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`chatme-tab-button ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  aria-label={`View ${tab}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="chatme-tab-content-container">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {isSelfChat && (
          <FloatingActionButton
            onPollCreate={handlePollCreate}
            onTextCreate={handleTextCreate}
            onMediaCreate={handleMediaCreate}
            modalOptions={[
              { type: 'camera', label: 'Camera', icon: <FiImage size={20} /> },
              { type: 'image', label: 'Image', icon: <FiImage size={20} /> },
              { type: 'video', label: 'Video', icon: <FiVideo size={20} /> },
              { type: 'audio', label: 'Audio', icon: <FiMic size={20} /> },
              { type: 'document', label: 'Document', icon: <FiFile size={20} /> },
              { type: 'text', label: 'Text', icon: <FiType size={20} /> },
            ]}
            isChatSelected={false}
            isFullscreen={isMediaFullscreen}
          />
        )}
      </div>
    </>
  );
};

ProfileViewer.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    profilePicture: PropTypes.string,
    isOnline: PropTypes.bool,
    lastSeen: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isFollowed: PropTypes.bool,
    isMuted: PropTypes.bool,
    isBlocked: PropTypes.bool,
    bio: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        url: PropTypes.string.isRequired,
      })
    ),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        url: PropTypes.string,
        mediaUrl: PropTypes.string,
        type: PropTypes.oneOf(['photo', 'video', 'audio', 'document', 'poll', 'text']),
        mediaType: PropTypes.oneOf(['photo', 'video', 'audio', 'document', 'poll', 'text']),
        caption: PropTypes.string,
        description: PropTypes.string,
        content: PropTypes.string,
        pollOptions: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            text: PropTypes.string,
            votes: PropTypes.number,
          })
        ),
        createdAt: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.instanceOf(Date),
        ]),
        uploadDate: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.instanceOf(Date),
        ]),
        likes: PropTypes.number,
        comments: PropTypes.array,
        commentCount: PropTypes.number,
        views: PropTypes.number,
        tags: PropTypes.arrayOf(PropTypes.string),
        trending: PropTypes.bool,
        width: PropTypes.number,
        height: PropTypes.number,
        originalFile: PropTypes.shape({
          name: PropTypes.string,
          type: PropTypes.string,
          size: PropTypes.number,
          lastModified: PropTypes.number,
        }),
      })
    ),
    followers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
    following: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        profilePicture: PropTypes.string,
      })
    ),
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string,
        text: PropTypes.string,
        createdAt: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.instanceOf(Date),
        ]),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func,
  onToggleFollow: PropTypes.func,
  onToggleBlock: PropTypes.func,
  onReport: PropTypes.func,
};

ProfileViewer.defaultProps = {
  onToggleMute: () => {},
  onToggleFollow: () => {},
  onToggleBlock: () => {},
  onReport: () => {},
};