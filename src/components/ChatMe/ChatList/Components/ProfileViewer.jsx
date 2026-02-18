import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiDownload, FiShare2, FiArrowLeft, FiFile, FiMic, FiType, FiImage, FiVideo, FiUser, FiMail, FiPhone, FiLink, FiChevronLeft, FiChevronRight, FiLock, FiUnlock, FiMapPin, FiBriefcase, FiBook, FiCalendar, FiGlobe, FiClock, FiUsers } from 'react-icons/fi';
import { MediaPanel } from './MediaPanel';
import { PoolPosts } from '../PoolPosts/PoolPosts';
import { FloatingActionButton } from './FABProfile';
import { supabase } from '../../../../supabase';
import './ProfileViewer.css';
import { getMaskedProfilePhoto, allowAbout } from '../../utils/privacyVisibility';

// Utility functions for localStorage
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`ProfileViewer.jsx: Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`ProfileViewer.jsx: Error saving ${key} to localStorage:`, error);
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
          console.warn(`ProfileViewer.jsx: Reading strategy ${strategy} failed for ${file.name}:`, error);
          lastError = error;
        }
      }

      if (attempts < maxAttempts) {
        console.log(`ProfileViewer.jsx: Retrying file read for ${file.name}, attempt ${attempts + 1}/${maxAttempts}`);
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
  isPageView = false,
}) => {
  const [showAvatarFullscreen, setShowAvatarFullscreen] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(1);
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
  const profileViewerRef = useRef(null);

  // log profile data on component mount
  useEffect(() => {
    console.log('ProfileViewer.jsx: Received profile prop:', {
      id: profile?.id,
      currentUserUid: profile?.currentUserUid,
      name: profile?.name,
      isCurrent: profile?.isCurrent,
      isOnline: profile?.isOnline,
      email: profile?.email,
      bio: profile?.bio,
      profilePicture: profile?.profilePicture, // Added logging for profilePicture
      hasMedia: !!profile?.media?.length,
      hasFollowers: !!profile?.followers?.length,
      hasFollowing: !!profile?.following?.length,
    });
  }, [profile]);

  // Fallback to supabase auth if currentUserUid is missing
  const [currentUserUid, setCurrentUserUid] = useState(profile?.currentUserUid);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!profile?.currentUserUid && user?.id) {
        setCurrentUserUid(user.id);
      }
    };
    getUser();
  }, [profile?.currentUserUid]);
  
  const isSelfChat = profile?.id === currentUserUid || profile?.isCurrent;

  // log isSelfChat evaluation
  useEffect(() => {
    console.log('ProfileViewer.jsx: isSelfChat evaluation:', {
      profileId: profile?.id,
      currentUserUid: profile?.currentUserUid || currentUserUid,
      isCurrent: profile?.isCurrent,
      isSelfChat,
    });
    if (!profile?.id) {
      console.warn('ProfileViewer.jsx: profile.id is missing or undefined');
    }
    if (!currentUserUid) {
      console.warn('ProfileViewer.jsx: currentUserUid is missing (both profile.currentUserUid and auth.currentUser.uid)');
    }
    if (isSelfChat) {
      console.log('ProfileViewer.jsx: FAB should be rendered');
    } else {
      console.log('ProfileViewer.jsx: FAB should NOT be rendered');
    }
  }, [profile?.id, profile?.currentUserUid, profile?.isCurrent, isSelfChat, currentUserUid]);

  // Persist states to localStorage
  useEffect(() => {
    console.log('ProfileViewer.jsx: Saving activeTab to localStorage:', activeTab);
    saveToLocalStorage(`activeTab_${profile.id}`, activeTab);
  }, [activeTab, profile.id]);

  useEffect(() => {
    console.log('ProfileViewer.jsx: Saving isPadlockOpen to localStorage:', isPadlockOpen);
    saveToLocalStorage(`padlock_${profile.id}`, isPadlockOpen);
  }, [isPadlockOpen, profile.id]);

  useEffect(() => {
    console.log('ProfileViewer.jsx: Saving uploadedMedia to localStorage:', uploadedMedia);
    saveToLocalStorage(`uploadedMedia_${profile.id}`, uploadedMedia);
  }, [uploadedMedia, profile.id]);

  // Ensure profile header is at the top on mount
  useEffect(() => {
    if (profileViewerRef.current) {
      console.log('ProfileViewer.jsx: Scrolling profile viewer to top');
      profileViewerRef.current.scrollTop = 0;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      console.log('ProfileViewer.jsx: Cleaning up, restoring body overflow');
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
        console.log('ProfileViewer.jsx: Closing profile actions menu due to outside click');
        setShowProfileActions(false);
      }
    };

    if (showProfileActions) {
      console.log('ProfileViewer.jsx: Adding click outside listener for profile actions menu');
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      console.log('ProfileViewer.jsx: Removing click outside listener');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileActions]);

  // Scroll active tab into view only when activeTab changes
  useEffect(() => {
    if (tabContainerRef.current && activeTab !== loadFromLocalStorage(`activeTab_${profile.id}`, 'posts')) {
      const activeTabElement = tabContainerRef.current.querySelector('.chatme-tab-button.active');
      if (activeTabElement) {
        console.log('ProfileViewer.jsx: Scrolling active tab into view:', activeTab);
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
      console.log(`ProfileViewer.jsx: Scrolling grid ${direction}`);
      const scrollAmount = gridRef.current.clientWidth * 0.5;
      gridRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle media selection
  const handleMediaSelect = (media, isFullscreenMode) => {
    console.log('ProfileViewer.jsx: Media selected:', { mediaId: media.id, isFullscreenMode });
    setIsMediaFullscreen(isFullscreenMode);
  };

  // Handle padlock toggle
  const handlePadlockToggle = () => {
    console.log('ProfileViewer.jsx: Toggling padlock, current state:', isPadlockOpen);
    setIsPadlockOpen((prev) => !prev);
  };

  // Handle media deletion
  const handleMediaDelete = (mediaId) => {
    console.log('ProfileViewer.jsx: Deleting media with ID:', mediaId);
    setUploadedMedia((prev) => prev.filter((item) => item.id !== mediaId));
  };

  const tabs = ['posts', 'following', 'mass', 'comments', 'likes', 'bookmarks'];

  const generateDefaultAvatar = (name = profile?.name || 'User') => {
    // Use first name (first word) for fallback instead of multiple initials
    const firstName = name.split(' ')[0];
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=${randomColor}&color=fff&size=256&rounded=true&bold=true`;
    console.log('ProfileViewer.jsx: Generated default avatar URL:', avatarUrl);
    return avatarUrl;
  };

  const handleDownloadAvatar = () => {
    console.log('ProfileViewer.jsx: Downloading avatar for:', profile.name);
    const link = document.createElement('a');
    const masked = getMaskedProfilePhoto(profile.profilePicture, profile.privacy || {}, !!profile.isContact);
    link.href = masked || generateDefaultAvatar();
    link.download = `${profile.name.replace(/\s+/g, '_')}_avatar.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareAvatar = async () => {
    console.log('ProfileViewer.jsx: Sharing avatar for:', profile.name);
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `${profile.name}'s Profile Picture`,
          text: `Check out ${profile.name}'s profile picture`,
          url: (getMaskedProfilePhoto(profile.profilePicture, profile.privacy || {}, !!profile.isContact) || generateDefaultAvatar()),
        };
        if (navigator.canShare(shareData)) {
          console.log('ProfileViewer.jsx: Using navigator.share for avatar');
          await navigator.share(shareData);
        } else {
          throw new Error('Cannot share this content');
        }
      } else {
        console.log('ProfileViewer.jsx: Falling back to clipboard for avatar share');
        await navigator.clipboard.writeText(
          (getMaskedProfilePhoto(profile.profilePicture, profile.privacy || {}, !!profile.isContact) || generateDefaultAvatar())
        );
        alert('Avatar URL copied to clipboard!');
      }
    } catch (err) {
      console.error('ProfileViewer.jsx: Error sharing avatar:', err);
      try {
        console.log('ProfileViewer.jsx: Copying avatar URL to clipboard');
        await navigator.clipboard.writeText(
          profile.profilePicture || generateDefaultAvatar()
        );
        alert('Avatar URL copied to clipboard!');
      } catch (clipboardErr) {
        console.error('ProfileViewer.jsx: Clipboard error:', clipboardErr);
        alert('Unable to share or copy URL');
      }
    }
  };

  // Process file content
  const processFileContent = async (file, fileContent, modalType) => {
    console.log('ProfileViewer.jsx: Processing file:', { name: file.name, type: file.type, modalType });
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

        console.log('ProfileViewer.jsx: Processed media:', newMedia);
        resolve(newMedia);
      } catch (error) {
        console.error(`ProfileViewer.jsx: Failed to process ${file.name}:`, error);
        reject(new Error(`Failed to process ${file.name}: ${error.message}`));
      }
    });
  };

  // Handle media creation
  const handleMediaCreate = async (files, description, modalType, fileContents = []) => {
    console.log(`ProfileViewer.jsx: handleMediaCreate called with ${files.length} files, modalType: ${modalType}, description:`, description);

    if (!files || files.length === 0) {
      console.error('ProfileViewer.jsx: No files provided for media creation');
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
          console.log(`ProfileViewer.jsx: Processing file ${i + 1}/${files.length}:`, file.name);
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

          console.log(`ProfileViewer.jsx: Successfully processed ${file.name}:`, newMedia);
        } catch (fileError) {
          console.error(`ProfileViewer.jsx: Error processing file ${file.name}:`, fileError);
          errors.push(`${file.name}: ${fileError.message}`);
          setUploadErrors(prev => ({
            ...prev,
            [uploadId]: [...(prev[uploadId] || []), `${file.name}: ${fileError.message}`],
          }));
        }
      }

      if (processedMedia.length > 0) {
        console.log(`ProfileViewer.jsx: Adding ${processedMedia.length} media items to uploadedMedia`);
        setUploadedMedia(prev => [...prev, ...processedMedia]);
      }

      if (errors.length > 0) {
        console.log('ProfileViewer.jsx: Upload errors occurred:', errors);
        setUploadErrors(prev => ({
          ...prev,
          [uploadId]: errors,
        }));
      }

      processingTimeoutRef.current = setTimeout(() => {
        console.log('ProfileViewer.jsx: Clearing upload progress and errors for uploadId:', uploadId);
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
      console.error('ProfileViewer.jsx: Error in handleMediaCreate:', error);
      setUploadErrors(prev => ({
        ...prev,
        [uploadId]: [...(prev[uploadId] || []), `General error: ${error.message}`],
      }));
    }
  };

  // Handle poll creation
  const handlePollCreate = (options, description) => {
    console.log('ProfileViewer.jsx: handlePollCreate called:', { options, description });
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
    console.log('ProfileViewer.jsx: New poll added:', newMedia);
    setUploadedMedia((prev) => [...prev, newMedia]);
  };

  // Handle text creation
  const handleTextCreate = async (text, files = []) => {
    console.log('ProfileViewer.jsx: handleTextCreate called:', { text, fileCount: files.length });
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
      console.log('ProfileViewer.jsx: New text post added:', newMedia);
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
    console.log('ProfileViewer.jsx: Transformed profile media:', combinedMedia);
    return combinedMedia;
  };

  // Render profile details (removed bio and email, now shown below name)
  const renderProfileDetails = () => {
    console.log('ProfileViewer.jsx: Rendering profile details, isPadlockOpen:', isPadlockOpen);
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

    const formatDate = (d) => {
      try {
        if (!d) return null;
        const date = new Date(d);
        if (isNaN(date)) return d;
        return date.toLocaleDateString();
      } catch (e) {
        return d;
      }
    };

    const renderList = (items, keyName = 'url') => (
      <ul className="chatme-links-list">
        {items.map((it, i) => (
          <li key={i}>
            {typeof it === 'string' ? (
              <a href={it} target="_blank" rel="noopener noreferrer" className="chatme-link-item">{it}</a>
            ) : (
              <a href={it[keyName] || '#'} target="_blank" rel="noopener noreferrer" className="chatme-link-item">{it.title || it[keyName]}</a>
            )}
          </li>
        ))}
      </ul>
    );

    const details = [
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
        content: profile.links && profile.links.length > 0 ? renderList(profile.links, 'url') : 'No links provided.',
      },
      {
        key: 'website',
        icon: <FiLink />,
        label: 'Website',
        content: profile.website ? (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="chatme-link-item">{profile.website}</a>
        ) : 'No website provided.',
      },
      {
        key: 'location',
        icon: <FiMapPin />, // will add FiMapPin fallback if not imported
        label: 'Location',
        content: profile.location || profile.city || profile.town || 'No location provided.',
      },
      {
        key: 'work',
        icon: <FiBriefcase />, // fallback icon
        label: 'Work',
        content: profile.work || profile.job || 'Not specified.',
      },
      {
        key: 'education',
        icon: <FiBook />, // fallback icon
        label: 'Education',
        content: profile.education || 'Not specified.',
      },
      {
        key: 'pronouns',
        icon: <FiUser />,
        label: 'Pronouns',
        content: profile.pronouns || 'Not specified.',
      },
      {
        key: 'birthday',
        icon: <FiCalendar />, // fallback icon
        label: 'Birthday',
        content: profile.birthday ? formatDate(profile.birthday) : 'Not provided.',
      },
      {
        key: 'socials',
        icon: <FiShare2 />,
        label: 'Socials',
        content: profile.socials && Object.keys(profile.socials).length > 0 ? (
          <ul className="chatme-links-list">
            {Object.entries(profile.socials).map(([k, v], i) => (
              <li key={i}><a href={v} target="_blank" rel="noopener noreferrer" className="chatme-link-item">{k}: {v}</a></li>
            ))}
          </ul>
        ) : 'No social handles provided.',
      },
      {
        key: 'languages',
        icon: <FiGlobe />, // fallback icon
        label: 'Languages',
        content: profile.languages && profile.languages.length > 0 ? profile.languages.join(', ') : 'Not specified.',
      },
      {
        key: 'timezone',
        icon: <FiClock />,
        label: 'Timezone',
        content: profile.timezone || 'Not provided.',
      },
      {
        key: 'mutualFriends',
        icon: <FiUsers />,
        label: 'Mutual Friends',
        content: profile.mutualFriends && profile.mutualFriends.length > 0 ? (
          <ul className="chatme-links-list">
            {profile.mutualFriends.slice(0, 6).map((m, i) => (
              <li key={i}>{m.name || m}</li>
            ))}
          </ul>
        ) : (profile.mutualFriendsCount ? `${profile.mutualFriendsCount} mutual friend(s)` : 'None'),
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
    console.log('ProfileViewer.jsx: Rendering tab content for tab:', activeTab);
    switch (activeTab) {
      case 'posts':
        const profileMedia = transformProfileMedia();
        const hasMediaData = profileMedia && profileMedia.length > 0;
        console.log('ProfileViewer.jsx: Posts tab - hasMediaData:', hasMediaData, 'media count:', profileMedia.length);
        return (
          <div className="chatme-tab-content">
            <div className="chatme-profile-media-panel">
              <MediaPanel
                demoMode={!hasMediaData}
                profileMedia={hasMediaData ? profileMedia : undefined}
                profileUser={profile.name}
                currentUser={profile.id}
                compactMode={true}
                key={`posts-${profileMedia.length}-${Date.now()}`}
                onMediaSelect={handleMediaSelect}
                onMediaDelete={handleMediaDelete}
              />
            </div>
          </div>
        );
      case 'mass':
        const massMedia = transformProfileMedia();
        const hasMassMediaData = massMedia && massMedia.length > 0;
        console.log('ProfileViewer.jsx: Mass tab - hasMassMediaData:', hasMassMediaData, 'media count:', massMedia.length);
        return (
          <div className="chatme-tab-content">
            <div className="chatme-profile-media-panel">
              <PoolPosts
                demoMode={!hasMassMediaData}
                profileMedia={hasMassMediaData ? massMedia : undefined}
                profileUser={profile.name}
                currentUser={profile.id}
                compactMode={true}
                key={`mass-${massMedia.length}-${Date.now()}`}
                onMediaSelect={handleMediaSelect}
                onMediaDelete={handleMediaDelete}
              />
            </div>
          </div>
        );
      case 'following':
      case 'comments':
      case 'likes':
      case 'bookmarks':
        console.log(`ProfileViewer.jsx: Rendering placeholder for tab: ${activeTab}`);
        return (
          <div className="chatme-tab-content">
            <p className="chatme-profile-detail-text">No content available.</p>
          </div>
        );
      default:
        console.warn('ProfileViewer.jsx: Unknown tab:', activeTab);
        return null;
    }
  };

  // log FAB rendering
  console.log('ProfileViewer.jsx: Rendering component, isSelfChat:', isSelfChat);

  // Page view rendering (full page without modal overlay)
  if (isPageView) {
    return (
      <>
        {showAvatarFullscreen && (
          <div
            className="chatme-avatar-fullscreen-overlay"
            onClick={() => {
              console.log('ProfileViewer.jsx: Closing avatar fullscreen');
              setShowAvatarFullscreen(false);
            }}
          >
            {/* Avatar fullscreen content */}
            <div
              className="chatme-avatar-fullscreen-container"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label={`${profile.name} avatar viewer`}
            >
              <img
                src={getMaskedProfilePhoto(profile.profilePicture, profile.privacy || {}, !!profile.isContact) || generateDefaultAvatar()}
                alt={profile.name}
                className="chatme-avatar-fullscreen-image"
                style={{
                  transform: `scale(${avatarZoom})`,
                  transition: 'transform 120ms ease-out',
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  display: 'block',
                  margin: '0 auto'
                }}
                onError={(e) => {
                  console.warn('ProfileViewer.jsx: Avatar image error in fullscreen, using default');
                  e.target.src = generateDefaultAvatar();
                }}
              />
              <div className="chatme-avatar-fullscreen-footer">
                <h3>{isSelfChat ? 'You' : profile.name}</h3>
                <p>{profile.bio || 'No bio available'}</p>
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

        {/* Page view container - no modal overlay */}
        <div className="chatme-profile-page-view" ref={profileViewerRef}>
          <div className="chatme-profile-page-content">
            {/* Header */}
            <div className="chatme-profile-viewer-header">
              <button
                className="chatme-close-button"
                onClick={() => {
                  console.log('ProfileViewer.jsx: Closing profile viewer');
                  onClose();
                }}
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
                  onClick={() => {
                    console.log('ProfileViewer.jsx: Toggling profile actions menu');
                    setShowProfileActions((prev) => !prev);
                  }}
                  aria-label="Profile actions"
                >
                  ⋮
                </button>
              )}
              {isSelfChat && <div className="chatme-profile-actions-placeholder"></div>}
              {!isSelfChat && showProfileActions && (
                <div className="chatme-profile-actions-menu" ref={menuRef}>
                  <button onClick={() => { onToggleFollow(); setShowProfileActions(false); }}>
                    {profile.isFollowed ? 'Unfollow' : 'Follow'}
                  </button>
                  <button onClick={() => { onToggleMute(); setShowProfileActions(false); }}>
                    {profile.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={() => { onToggleBlock(); setShowProfileActions(false); }}>
                    {profile.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button onClick={() => { onReport(); setShowProfileActions(false); }}>
                    Report
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="chatme-profile-content">
              {/* Avatar with online indicator */}
              <div
                className="chatme-profile-image-container"
                onClick={() => {
                  console.log('ProfileViewer.jsx: Opening avatar fullscreen');
                  setShowAvatarFullscreen(true);
                }}
                role="button"
                aria-label="View profile picture"
                tabIndex={0}
              >
                <img
                  src={profile.profilePicture || generateDefaultAvatar()}
                  alt={profile.name}
                  className="chatme-profile-image"
                  onError={(e) => {
                    console.warn('ProfileViewer.jsx: Profile image error, using default. Original src:', e.target.src);
                    e.target.src = generateDefaultAvatar();
                  }}
                />
                {!isSelfChat && profile.isOnline && (
                  <div className="chatme-profile-online-indicator" aria-hidden={false} title="Online">
                    <span className="chatme-online-dot" />
                  </div>
                )}
              </div>

              {/* Profile info */}
              <div className="chatme-profile-info">
                <h2>{isSelfChat ? 'You' : profile.name}</h2>
                {allowAbout(profile.privacy || {}, !!profile.isContact) && (
                  <p className="profile-header-bio">{profile.bio}</p>
                )}
                {profile.email && <p className="chatme-profile-email">{profile.email}</p>}
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
              </div>

              {/* Tabs */}
              <div className="chatme-profile-tabs" ref={tabContainerRef}>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`chatme-tab-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => {
                      console.log('ProfileViewer.jsx: Switching to tab:', tab);
                      setActiveTab(tab);
                    }}
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

          {isSelfChat ? (
            <>
              {console.log('ProfileViewer.jsx: Rendering FloatingActionButton for current user (page view)')}
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
            </>
          ) : (
            console.log('ProfileViewer.jsx: Skipping FloatingActionButton render, not current user (page view)')
          )}
        </div>
      </>
    );
  }

  // Modal view rendering (original modal overlay)
  return (
    <>
        <div
          className="chatme-avatar-fullscreen-overlay"
          onClick={() => {
            console.log('ProfileViewer.jsx: Closing avatar fullscreen');
            setShowAvatarFullscreen(false);
          }}
        >
          <div
            className="chatme-avatar-fullscreen-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${profile.name} avatar viewer`}
          >
            <img
              src={getMaskedProfilePhoto(profile.profilePicture, profile.privacy || {}, !!profile.isContact) || generateDefaultAvatar()}
              alt={profile.name}
              className="chatme-avatar-fullscreen-image"
              style={{
                transform: `scale(${avatarZoom})`,
                transition: 'transform 120ms ease-out',
                maxWidth: '100%',
                maxHeight: '70vh',
                display: 'block',
                margin: '0 auto'
              }}
              onError={(e) => {
                console.warn('ProfileViewer.jsx: Avatar image error in fullscreen, using default');
                e.target.src = generateDefaultAvatar();
              }}
            />
            <div className="chatme-avatar-fullscreen-footer">
              <h3>{isSelfChat ? 'You' : profile.name}</h3>
              <p>{profile.bio || 'No bio available'}</p>

              {/* Zoom controls + actions */}
              <div className="chatme-avatar-controls">
                <div className="chatme-zoom-controls">
                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => { e.stopPropagation(); setAvatarZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))); }}
                    aria-label="Zoom out"
                    title="Zoom out"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={avatarZoom}
                    onChange={(e) => { e.stopPropagation(); setAvatarZoom(Number(e.target.value)); }}
                    className="chatme-zoom-slider"
                    aria-label="Zoom"
                  />
                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => { e.stopPropagation(); setAvatarZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))); }}
                    aria-label="Zoom in"
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => { e.stopPropagation(); setAvatarZoom(1); }}
                    aria-label="Reset zoom"
                    title="Reset"
                  >
                    Reset
                  </button>
                </div>

                <div className="chatme-avatar-actions">
                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadAvatar();
                    }}
                    aria-label="Download avatar"
                    title="Save"
                  >
                    <FiDownload size={18} />
                  </button>

                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareAvatar();
                    }}
                    aria-label="Share avatar"
                    title="Share"
                  >
                    <FiShare2 size={18} />
                  </button>

                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (profile.phone) {
                        window.location.href = `tel:${profile.phone}`;
                      } else {
                        alert('No phone number available');
                      }
                    }}
                    aria-label="Call"
                    title="Call"
                  >
                    <FiPhone size={18} />
                  </button>

                  <button
                    className="chatme-avatar-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (profile.videoCallUrl) {
                        window.open(profile.videoCallUrl, '_blank');
                      } else {
                        alert('No video call link available');
                      }
                    }}
                    aria-label="Video call"
                    title="Video"
                  >
                    <FiVideo size={18} />
                  </button>
                </div>
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

      <div 
        className={`chatme-profile-viewer-overlay ${isPageView ? 'page-view' : ''}`} 
        ref={profileViewerRef}
      >
        <div className={`chatme-profile-modal-container ${isPageView ? 'page-view' : ''}`}>
          <div className="chatme-profile-viewer-header">
            <button
              className="chatme-close-button"
              onClick={() => {
                console.log('ProfileViewer.jsx: Closing profile viewer');
                onClose();
              }}
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
                onClick={() => {
                  console.log('ProfileViewer.jsx: Toggling profile actions menu');
                  setShowProfileActions((prev) => !prev);
                }}
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
                    console.log('ProfileViewer.jsx: Toggling follow for user:', profile.id);
                    onToggleFollow();
                    setShowProfileActions(false);
                  }}
                >
                  {profile.isFollowed ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={() => {
                    console.log('ProfileViewer.jsx: Toggling mute for user:', profile.id);
                    onToggleMute();
                    setShowProfileActions(false);
                  }}
                >
                  {profile.isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  onClick={() => {
                    console.log('ProfileViewer.jsx: Toggling block for user:', profile.id);
                    onToggleBlock();
                    setShowProfileActions(false);
                  }}
                >
                  {profile.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                  onClick={() => {
                    console.log('ProfileViewer.jsx: Reporting user:', profile.id);
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
              onClick={() => {
                console.log('ProfileViewer.jsx: Opening avatar fullscreen');
                setShowAvatarFullscreen(true);
              }}
              role="button"
              aria-label="View profile picture"
              tabIndex={0}
            >
              <img
                src={profile.profilePicture || generateDefaultAvatar()}
                alt={profile.name}
                className="chatme-profile-image"
                onError={(e) => {
                  console.warn('ProfileViewer.jsx: Profile image error, using default. Original src:', e.target.src);
                  e.target.src = generateDefaultAvatar();
                }}
              />
              {!isSelfChat && profile.isOnline && (
                <div className="chatme-profile-online-indicator" aria-hidden={false} title="Online">
                  <span className="chatme-online-dot" />
                </div>
              )}
            </div>

            <div className="chatme-profile-info">
              <h2>{isSelfChat ? 'You' : profile.name}</h2>
              {allowAbout(profile.privacy || {}, !!profile.isContact) && (
                <p className="profile-header-bio">{profile.bio}</p>
              )}
              {profile.email && <p className="chatme-profile-email">{profile.email}</p>}
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
                    onClick={() => {
                      console.log('ProfileViewer.jsx: Switching to tab:', tab);
                      setActiveTab(tab);
                    }}
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

          {isSelfChat ? (
            <>
              {console.log('ProfileViewer.jsx: Rendering FloatingActionButton for current user')}
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
            </>
          ) : (
            console.log('ProfileViewer.jsx: Skipping FloatingActionButton render, not current user')
          )}
        </div>
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
    currentUserUid: PropTypes.string,
    isCurrent: PropTypes.bool,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func,
  onToggleFollow: PropTypes.func,
  onToggleBlock: PropTypes.func,
  onReport: PropTypes.func,
  isPageView: PropTypes.bool,
};

ProfileViewer.defaultProps = {
  onToggleMute: () => { },
  onToggleFollow: () => { },
  onToggleBlock: () => { },
  onReport: () => { },
  isPageView: false,
};
