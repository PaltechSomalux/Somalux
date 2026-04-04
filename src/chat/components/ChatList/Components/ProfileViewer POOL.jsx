
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiDownload, FiShare2, FiArrowLeft, FiFile, FiMic, FiType } from 'react-icons/fi';
import { PoolPosts } from './PoolPosts';
import { FloatingActionButton } from './FABProfile';
import './ProfileViewer.css';

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
  const [activeTab, setActiveTab] = useState('posts');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const contentRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const touchStartTime = useRef(null);

  const isSelfChat = profile?.id === 'yourself';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

  const tabs = ['posts', 'following', 'mass', 'comments', 'likes', 'bookmarks'];

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const swipeThreshold = 30;
    const velocityThreshold = 0.3;

    if (isTransitioning) return;

    const velocity = Math.abs(deltaX / deltaTime);
    if (Math.abs(deltaX) > swipeThreshold || velocity > velocityThreshold) {
      const currentIndex = tabs.indexOf(activeTab);
      setIsTransitioning(true);
      if (deltaX > 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
      setTimeout(() => setIsTransitioning(false), 300); // Match animation duration
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartTime.current = null;
  };

  if (!profile) return null;

  const generateDefaultAvatar = (name = profile.name) => {
    const initials = name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase()
      : 'US';
    const colors = ['#00a884', '#25D366', '#128C7E', '#075E54', '#34B7F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      initials
    )}&background=${randomColor}&color=fff&size=256`;
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
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name}'s Profile Picture`,
          text: `Check out ${profile.name}'s profile picture`,
          url: profile.profilePicture || generateDefaultAvatar(),
        });
      } else {
        await navigator.clipboard.writeText(
          profile.profilePicture || generateDefaultAvatar()
        );
        alert('Avatar URL copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleGallerySelect = (file, description) => {
    console.log('handleGallerySelect:', file.name, description);
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        mediaUrl: reader.result,
        mediaType: file.type.startsWith('image/') ? 'photo' : 'video',
        caption: description || `Media from ${profile.name}`,
        description: description || '',
        user: profile.name,
        userId: profile.id,
        uploadDate: new Date().toISOString(),
        likes: 0,
        comments: [],
        commentCount: 0,
        views: 0,
        width: 1000,
        height: 1000,
      };
      console.log('New media added:', newMedia);
      setUploadedMedia((prev) => [...prev, newMedia]);
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Failed to read file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (file, description) => {
    console.log('handleCameraCapture:', file.name, description);
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        mediaUrl: reader.result,
        mediaType: 'photo',
        caption: description || `Photo from ${profile.name}`,
        description: description || '',
        user: profile.name,
        userId: profile.id,
        uploadDate: new Date().toISOString(),
        likes: 0,
        comments: [],
        commentCount: 0,
        views: 0,
        width: 1000,
        height: 1000,
      };
      console.log('New camera photo added:', newMedia);
      setUploadedMedia((prev) => [...prev, newMedia]);
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Failed to read camera capture. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleAudioRecord = (file, description) => {
    console.log('handleAudioRecord:', file.name, description);
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        mediaUrl: reader.result,
        mediaType: 'audio',
        caption: description || `Audio from ${profile.name}`,
        description: description || '',
        user: profile.name,
        userId: profile.id,
        uploadDate: new Date().toISOString(),
        likes: 0,
        comments: [],
        commentCount: 0,
        views: 0,
        width: 1000,
        height: 1000,
      };
      console.log('New audio added:', newMedia);
      setUploadedMedia((prev) => [...prev, newMedia]);
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Failed to read audio file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentSelect = (file, description) => {
    console.log('handleDocumentSelect:', file.name, description);
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia = {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        mediaUrl: reader.result,
        mediaType: 'document',
        caption: description || file.name,
        description: description || '',
        user: profile.name,
        userId: profile.id,
        uploadDate: new Date().toISOString(),
        likes: 0,
        comments: [],
        commentCount: 0,
        views: 0,
        width: 1000,
        height: 1000,
      };
      console.log('New document added:', newMedia);
      setUploadedMedia((prev) => [...prev, newMedia]);
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Failed to read document. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

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
        votes: 0,
      })),
    };
    console.log('New poll added:', newMedia);
    setUploadedMedia((prev) => [...prev, newMedia]);
  };

  const handleTextCreate = (text, description) => {
    console.log('handleTextCreate:', text, description);
    const newMedia = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      mediaType: 'text',
      caption: description || `Text post by ${profile.name}`,
      description: description || '',
      content: text,
      user: profile.name,
      userId: profile.id,
      uploadDate: new Date().toISOString(),
      likes: 0,
      comments: [],
      commentCount: 0,
      views: 0,
      width: 1000,
      height: 1000,
    };
    console.log('New text post added:', newMedia);
    setUploadedMedia((prev) => [...prev, newMedia]);
  };

  const transformProfileMedia = () => {
    const originalMedia = profile.media || [];
    const combinedMedia = [...originalMedia, ...uploadedMedia].map((item) => ({
      id: item.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      mediaUrl: item.url || item.mediaUrl,
      mediaType: item.type || item.mediaType || 'photo',
      caption: item.caption || `Media from ${profile.name}`,
      description: item.description || '',
      content: item.content || '', // For text posts
      pollOptions: item.pollOptions || [], // For polls
      user: profile.name,
      userId: profile.id,
      uploadDate: item.createdAt || item.uploadDate || new Date().toISOString(),
      likes: item.likes || 0,
      comments: item.comments || [],
      commentCount: item.commentCount || (item.comments || []).length,
      views: item.views || Math.floor(Math.random() * 1000) + 100,
      tags: item.tags || [],
      trending: item.trending || false,
      width: item.width || 1000,
      height: item.height || 1000,
    }));
    console.log('Transformed profile media:', combinedMedia);
    return combinedMedia;
  };

  const renderPosts = () => {
    const profileMedia = transformProfileMedia();
    const hasMediaData = profileMedia && profileMedia.length > 0;

    return (
      <div className="chatme-tab-content">
        <div className="profile-media-panel">
          <PoolPosts
            demoMode={!hasMediaData}
            profileMedia={hasMediaData ? profileMedia : undefined}
            profileUser={profile.name}
            compactMode={true}
            key={profileMedia.length} // Force re-render on new uploads
          />
        </div>
      </div>
    );
  };

  const renderFollowing = () => {
    if (!profile.following || profile.following.length === 0) {
      return <p>Not following anyone.</p>;
    }
    return (
      <div className="chatme-tab-content">
        {profile.following.map((following) => (
          <div key={following.id} className="chatme-user-item">
            <img
              src={following.profilePicture || generateDefaultAvatar(following.name)}
              alt={following.name}
              className="chatme-user-avatar"
            />
            <span>{following.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderMass = () => {
    const profileMedia = transformProfileMedia();
    const hasMediaData = profileMedia && profileMedia.length > 0;

    return (
      <div className="chatme-tab-content">
        <div className="profile-media-panel">
          <PoolPosts
            demoMode={!hasMediaData}
            profileMedia={hasMediaData ? profileMedia : undefined}
            profileUser={profile.name}
            compactMode={true}
            key={profileMedia.length} // Force re-render on new uploads
          />
        </div>
      </div>
    );
  };

  const renderComments = () => {
    if (!profile.comments || profile.comments.length === 0) {
      return <p>No comments available.</p>;
    }
    return (
      <div className="chatme-tab-content">
        {profile.comments.map((comment) => (
          <div key={comment.id} className="chatme-post-item">
            <p>{comment.content}</p>
            <span className="chatme-post-date">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderLikes = () => {
    return (
      <div className="chatme-tab-content">
        <p>No liked posts available.</p>;
      </div>
    );
  };

  const renderBookmarks = () => {
    return (
      <div className="chatme-tab-content">
        <p>No bookmarked posts available.</p>;
      </div>
    );
  };

  const renderBio = () => {
    return (
      <div className="chatme-bio-section">
        <div className="chatme-bio-links-container">
          <div className="chatme-bio-content">
            {profile.bio ? (
              <p className="chatme-bio-text">{profile.bio}</p>
            ) : (
              <p className="chatme-bio-text">No bio available.</p>
            )}
          </div>
          <div className="chatme-links-content">
            {profile.links && profile.links.length > 0 ? (
              <>
                <h4>Links</h4>
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
              </>
            ) : (
              <p className="chatme-bio-text">No links available.</p>
            )}
          </div>
        </div>
      </div>
    );
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
            />
            <div className="chatme-avatar-fullscreen-footer">
              <h3>{isSelfChat ? 'You' : profile.name}</h3>
              <div className="chatme-avatar-actions">
                <button
                  className="chatme-avatar-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAvatar();
                  }}
                  aria-label="Download avatar"
                >
                  <FiDownload />
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
                  <FiShare2 />
                  <span>Share</span>
                </button>
              </div>
            </div>
            <button
              className="chatme-avatar-close-button"
              onClick={() => setShowAvatarFullscreen(false)}
              aria-label="Close avatar view"
            >
              <FiArrowLeft />
            </button>
          </div>
        </div>
      )}

      <div className="chatme-profile-viewer-overlay">
        <div className="chatme-profile-viewer-header">
          <button
            className="chatme-close-button"
            onClick={onClose}
            aria-label="Close profile"
          >
            <FiArrowLeft />
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
            {renderBio()}
            <div className="chatme-profile-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`chatme-tab-button ${
                    activeTab === tab ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab(tab)}
                  aria-label={`View ${tab}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div
              className="chatme-tab-content-container"
              ref={contentRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {activeTab === 'posts' && renderPosts()}
              {activeTab === 'following' && renderFollowing()}
              {activeTab === 'mass' && renderMass()}
              {activeTab === 'comments' && renderComments()}
              {activeTab === 'likes' && renderLikes()}
              {activeTab === 'bookmarks' && renderBookmarks()}
            </div>
          </div>
        </div>

        {isSelfChat && (
          <FloatingActionButton
            onGallerySelect={handleGallerySelect}
            onDocumentSelect={handleDocumentSelect}
            onCameraCapture={handleCameraCapture}
            onAudioRecord={handleAudioRecord}
            onPollCreate={handlePollCreate}
            onTextCreate={handleTextCreate}
            isChatSelected={false}
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
    isFollowed: PropTypes.bool,
    isMuted: PropTypes.bool,
    isBlocked: PropTypes.bool,
    bio: PropTypes.string,
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
        content: PropTypes.string.isRequired,
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
