// PoolPosts.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import {PostCard} from './PostCard';
import {FullScreenPost} from './FullScreenPost';
import {QuoteModal} from '../Components/QuoteModal';
import './PoolPosts.css';

// Placeholder user and media data
const placeholderUserData = {
  user1: { username: 'John Doe', handle: '@johndoe', avatar: 'https://via.placeholder.com/40' },
  user2: { username: 'Jane Smith', handle: '@janesmith', avatar: 'https://via.placeholder.com/40' },
  user3: { username: 'Alex Johnson', handle: '@alexjohnson', avatar: 'https://via.placeholder.com/40' },
};

const placeholderMediaData = [
  {
    id: '1',
    userId: 'user1',
    uploadDate: '2025-09-24T10:00:00Z',
    mediaType: 'photo',
    mediaUrl: 'https://via.placeholder.com/600x400',
    caption: 'Beautiful sunset!',
    description: 'Captured this amazing sunset at the beach.',
    likes: 120,
    comments: [],
    commentCount: 0,
    views: 500,
    quotePostCount: 5,
    width: 600,
    height: 400,
  },
  {
    id: '2',
    userId: 'user2',
    uploadDate: '2025-09-24T09:30:00Z',
    mediaType: 'text',
    content: 'Excited for the new tech conference next week! #Tech2025',
    likes: 80,
    comments: [],
    commentCount: 0,
    views: 300,
    quotePostCount: 2,
  },
  {
    id: '3',
    userId: 'user3',
    uploadDate: '2025-09-24T08:45:00Z',
    mediaType: 'video',
    mediaUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    caption: 'Funny video clip',
    description: 'Check out this hilarious clip!',
    likes: 200,
    comments: [],
    commentCount: 0,
    views: 1000,
    quotePostCount: 10,
    width: 720,
    height: 480,
  },
];

const getRelativeTime = (date) => {
  const now = new Date();
  const timestamp = new Date(date);
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

export const PoolPosts = ({
  demoMode = false,
  profileMedia,
  profileUser,
  currentUser = 'current_user',
  compactMode = false,
  onMediaSelect,
}) => {
  const [media, setMedia] = useState(() => {
    try {
      const saved = localStorage.getItem('persistedMedia');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load persisted media from localStorage:', error);
      return [];
    }
  });
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem('userData');
      return saved ? JSON.parse(saved) : placeholderUserData;
    } catch (error) {
      console.error('Failed to load user data from localStorage:', error);
      return placeholderUserData;
    }
  });
  const [displayedMedia, setDisplayedMedia] = useState([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState(() => {
    try {
      const saved = localStorage.getItem('deletedMediaIds');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load deleted media IDs from localStorage:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteTargetMedia, setQuoteTargetMedia] = useState(null);
  const [followedUsers, setFollowedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('followedUsers');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load followed users from localStorage:', error);
      return [];
    }
  });
  const reactionsRef = useRef(null);
  const commentsRef = useRef(null);

  const [mediaLikes, setMediaLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaLikes');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media likes from localStorage:', error);
      return {};
    }
  });

  const [mediaBookmarks, setMediaBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaBookmarks');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media bookmarks from localStorage:', error);
      return {};
    }
  });

  const [mediaComments, setMediaComments] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaComments');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media comments from localStorage:', error);
      return {};
    }
  });

  const [commentLikes, setCommentLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('commentLikes');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load comment likes from localStorage:', error);
      return {};
    }
  });

  const [mediaReactions, setMediaReactions] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaReactions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load media reactions from localStorage:', error);
      return {};
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Processing media data...');
      let dataToUse = media.length > 0 ? media : (profileMedia || placeholderMediaData);
      const processedData = dataToUse
        .filter((item) => !deletedMediaIds.includes(item.id))
        .map((item) => ({
          ...item,
          user: userData[item.userId]?.username || item.user || 'Unknown User',
          userId: item.userId || 'unknown',
          comments: Array.isArray(mediaComments[item.id])
            ? mediaComments[item.id]
            : Array.isArray(item.comments)
            ? item.comments
            : [],
          commentCount: item.commentCount !== undefined
            ? item.commentCount
            : Array.isArray(item.comments)
            ? item.comments.length
            : 0,
          description: item.description || '',
          content: item.content || '',
          pollOptions: item.pollOptions || [],
          width: item.width || 1920,
          height: item.height || 1080,
          quotePostCount: item.quotePostCount || 0,
          isQuote: item.isQuote || false,
          originalPost: item.originalPost || null,
        }))
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

      console.log('Processed media:', processedData);
      setMedia(processedData);
      setDisplayedMedia(processedData);
      setLoading(false);

      try {
        localStorage.setItem('persistedMedia', JSON.stringify(processedData));
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (error) {
        console.error('Failed to save data to localStorage:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [profileMedia, userData, mediaComments, deletedMediaIds]);

  useEffect(() => {
    try {
      localStorage.setItem('mediaComments', JSON.stringify(mediaComments));
      localStorage.setItem('commentLikes', JSON.stringify(commentLikes));
      localStorage.setItem('mediaLikes', JSON.stringify(mediaLikes));
      localStorage.setItem('mediaBookmarks', JSON.stringify(mediaBookmarks));
      localStorage.setItem('mediaReactions', JSON.stringify(mediaReactions));
      localStorage.setItem('deletedMediaIds', JSON.stringify(deletedMediaIds));
      localStorage.setItem('followedUsers', JSON.stringify(followedUsers));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [mediaComments, commentLikes, mediaLikes, mediaBookmarks, mediaReactions, deletedMediaIds, followedUsers]);

  const handleMediaSelect = (item) => {
    const mediaToSelect = item.mediaType === 'quote' && item.originalPost ? item.originalPost : item;
    setSelectedMedia(mediaToSelect);
    setShowComments(false);
    setOpenMenuId(null);
    if (onMediaSelect) {
      onMediaSelect(mediaToSelect);
    }
  };

  const closeFullScreen = () => {
    setSelectedMedia(null);
    setShowComments(false);
    setOpenMenuId(null);
  };

  const toggleLike = (mediaId) => {
    setMediaLikes((prev) => {
      const currentLikes = prev[mediaId] || 0;
      const isCurrentlyLiked = mediaReactions[mediaId]?.liked;
      const newLikes = isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1;

      return {
        ...prev,
        [mediaId]: newLikes,
      };
    });

    setMediaReactions((prev) => ({
      ...prev,
      [mediaId]: {
        ...prev[mediaId],
        liked: !prev[mediaId]?.liked,
      },
    }));
  };

  const toggleBookmark = (mediaId) => {
    setMediaBookmarks((prev) => ({
      ...prev,
      [mediaId]: !prev[mediaId],
    }));
  };

  const toggleFollow = (userId) => {
    setFollowedUsers((prev) => {
      const isFollowing = prev.includes(userId);
      const updated = isFollowing
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      return updated;
    });
  };

  const handleQuoteClick = (media) => {
    setQuoteTargetMedia(media);
    setShowQuoteModal(true);
  };

  const handleQuoteSubmit = async (quoteData) => {
    const newQuotePost = {
      id: `quote_${Date.now()}`,
      user: userData[currentUser]?.username || currentUser,
      userId: currentUser,
      uploadDate: new Date().toISOString(),
      mediaType: 'quote',
      content: '',
      description: quoteData.text,
      isQuote: true,
      originalPost: quoteData.quotedMedia,
      likes: 0,
      comments: [],
      commentCount: 0,
      quotePostCount: 0,
      views: 0,
      width: quoteData.quotedMedia.width,
      height: quoteData.quotedMedia.height,
    };

    setMedia((prev) => {
      const updatedMedia = [newQuotePost, ...prev];
      try {
        localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
      } catch (error) {
        console.error('Failed to save media to localStorage:', error);
      }
      return updatedMedia;
    });

    setDisplayedMedia((prev) => [newQuotePost, ...prev]);

    const originalMediaId = quoteData.quotedMedia.id;
    setMedia((prevMedia) => {
      const updatedMedia = prevMedia.map((item) =>
        item.id === originalMediaId
          ? {
              ...item,
              quotePostCount: (item.quotePostCount || 0) + 1,
            }
          : item
      );
      try {
        localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
      } catch (error) {
        console.error('Failed to save media to localStorage:', error);
      }
      return updatedMedia;
    });

    setDisplayedMedia((prevMedia) =>
      prevMedia.map((item) =>
        item.id === originalMediaId
          ? {
              ...item,
              quotePostCount: (item.quotePostCount || 0) + 1,
            }
          : item
      )
    );

    setShowQuoteModal(false);
    setQuoteTargetMedia(null);
  };

  const handleShare = (media) => {
    try {
      let shareUrl = media.mediaType === 'poll' || media.mediaType === 'text' || media.mediaType === 'quote' ? window.location.href : media.mediaUrl;
      try {
        new URL(shareUrl);
      } catch {
        console.warn(`Invalid URL for share: ${shareUrl}, falling back to window.location.href`);
        shareUrl = window.location.href;
      }

      if (navigator.share) {
        navigator.share({
          title: media.caption || 'Media Content',
          text: media.caption || 'Check out this content!',
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  const handleDownload = async (media) => {
    if (media.mediaType === 'poll' || media.mediaType === 'text' || media.mediaType === 'quote') {
      alert('Download not available for this content type.');
      return;
    }

    try {
      const response = await fetch(media.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = {
        photo: 'jpg',
        video: 'mp4',
        audio: 'mp3',
        document: media.caption?.split('.').pop() || 'pdf',
      }[media.mediaType] || 'file';
      link.download = `${media.caption || 'media'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download media. Please try again.');
    }
  };

  const handleSubmitComment = async (commentData) => {
    if (!selectedMedia) return;

    try {
      setMediaComments((prev) => ({
        ...prev,
        [selectedMedia.id]: [
          ...(Array.isArray(prev[selectedMedia.id]) ? prev[selectedMedia.id] : []),
          commentData,
        ],
      }));

      setMedia((prevMedia) => {
        const updatedMedia = prevMedia.map((item) =>
          item.id === selectedMedia.id
            ? {
                ...item,
                comments: [
                  ...(Array.isArray(item.comments) ? item.comments : []),
                  commentData,
                ],
                commentCount: (item.commentCount || 0) + 1,
              }
            : item
        );
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (!selectedMedia) return;

    try {
      setMediaComments((prev) => ({
        ...prev,
        [selectedMedia.id]: (prev[selectedMedia.id] || []).filter(
          (c) => c.id !== commentId
        ),
      }));

      setMedia((prevMedia) => {
        const updatedMedia = prevMedia.map((item) =>
          item.id === selectedMedia.id
            ? {
                ...item,
                comments: (item.comments || []).filter((c) => c.id !== commentId),
                commentCount: Math.max((item.commentCount || 0) - 1, 0),
              }
            : item
        );
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });

      setCommentLikes((prevLikes) => {
        const updated = { ...prevLikes };
        delete updated[commentId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleLikeComment = (commentId) => {
    try {
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: !(prev[commentId] || false),
      }));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReplyToComment = (commentId, reply) => {
    if (!selectedMedia) return;

    try {
      setMediaComments((prev) => {
        const updatedComments = { ...prev };
        const comments = Array.isArray(prev[selectedMedia.id])
          ? prev[selectedMedia.id]
          : [];

        const updated = comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [
                ...(Array.isArray(comment.replies) ? comment.replies : []),
                reply,
              ],
            };
          }
          return comment;
        });

        updatedComments[selectedMedia.id] = updated;
        return updatedComments;
      });

      setMedia((prevMedia) => {
        const updatedMedia = prevMedia.map((item) =>
          item.id === selectedMedia.id
            ? {
                ...item,
                comments: (item.comments || []).map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        replies: [
                          ...(Array.isArray(comment.replies)
                            ? comment.replies
                            : []),
                          reply,
                        ],
                      }
                    : comment
                ),
              }
            : item
        );
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });
    } catch (error) {
      console.error('Failed to reply to comment:', error);
    }
  };

  const toggleMenu = (mediaId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === mediaId ? null : mediaId);
  };

  const handleDelete = (mediaId) => {
    try {
      console.log(`Deleting post with ID: ${mediaId}`);
      setDeletedMediaIds((prev) => {
        const updated = [...prev, mediaId];
        try {
          localStorage.setItem('deletedMediaIds', JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save deleted media IDs to localStorage:', error);
        }
        return updated;
      });

      setMedia((prev) => {
        const updatedMedia = prev.filter((item) => item.id !== mediaId);
        try {
          localStorage.setItem('persistedMedia', JSON.stringify(updatedMedia));
        } catch (error) {
          console.error('Failed to save media to localStorage:', error);
        }
        return updatedMedia;
      });

      setDisplayedMedia((prev) => prev.filter((item) => item.id !== mediaId));

      setMediaLikes((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaBookmarks((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaComments((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      setMediaReactions((prev) => {
        const updated = { ...prev };
        delete updated[mediaId];
        return updated;
      });

      if (selectedMedia?.id === mediaId) {
        setSelectedMedia(null);
        setShowComments(false);
      }

      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleReport = (mediaId) => {
    console.log(`Report post with ID: ${mediaId}`);
    setOpenMenuId(null);
  };

  const handleMute = (mediaId) => {
    console.log(`Mute user for post with ID: ${mediaId}`);
    setOpenMenuId(null);
  };

  const handleBlock = (mediaId) => {
    console.log(`Block user for post with ID: ${mediaId}`);
    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className={`containerPool ${compactMode ? 'compact-containerPool' : ''}`}>
        <div className="gridPool">
          {[...Array(6)].map((_, index) => (
            <div className="skeleton-cardPool" key={index}>
              <div className="skeleton-userPool"></div>
              <div className="skeleton-mediaPool"></div>
              <div className="skeleton-actionsPool"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`containerPool ${compactMode ? 'compact-containerPool' : ''}`}>
      <div className={`gridPool ${compactMode ? 'compact-gridPool' : ''}`}>
        <AnimatePresence>
          {displayedMedia.map((item) => (
            selectedMedia?.id === item.id ? (
              <FullScreenPost
                key={item.id}
                item={item}
                userData={userData}
                currentUser={currentUser}
                openMenuId={openMenuId}
                toggleMenu={toggleMenu}
                handleDelete={handleDelete}
                handleReport={handleReport}
                handleMute={handleMute}
                handleBlock={handleBlock}
                toggleFollow={toggleFollow}
                followedUsers={followedUsers}
                handleMediaSelect={handleMediaSelect}
                mediaReactions={mediaReactions}
                mediaLikes={mediaLikes}
                mediaBookmarks={mediaBookmarks}
                toggleLike={toggleLike}
                handleQuoteClick={handleQuoteClick}
                toggleBookmark={toggleBookmark}
                handleShare={handleShare}
                handleDownload={handleDownload}
                showComments={showComments}
                setShowComments={setShowComments}
                closeFullScreen={closeFullScreen}
                mediaComments={mediaComments}
                commentLikes={commentLikes}
                handleSubmitComment={handleSubmitComment}
                handleDeleteComment={handleDeleteComment}
                handleLikeComment={handleLikeComment}
                handleReplyToComment={handleReplyToComment}
                reactionsRef={reactionsRef}
                commentsRef={commentsRef}
              />
            ) : (
              <PostCard
                key={item.id}
                item={item}
                userData={userData}
                currentUser={currentUser}
                openMenuId={openMenuId}
                toggleMenu={toggleMenu}
                handleDelete={handleDelete}
                handleReport={handleReport}
                handleMute={handleMute}
                handleBlock={handleBlock}
                toggleFollow={toggleFollow}
                followedUsers={followedUsers}
                handleMediaSelect={handleMediaSelect}
                mediaReactions={mediaReactions}
                mediaLikes={mediaLikes}
                mediaBookmarks={mediaBookmarks}
                toggleLike={toggleLike}
                handleQuoteClick={handleQuoteClick}
                toggleBookmark={toggleBookmark}
                handleShare={handleShare}
                handleDownload={handleDownload}
                setShowComments={setShowComments}
                showComments={showComments}
              />
            )
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showQuoteModal && quoteTargetMedia && (
          <QuoteModal
            isOpen={showQuoteModal}
            onClose={() => {
              setShowQuoteModal(false);
              setQuoteTargetMedia(null);
            }}
            media={quoteTargetMedia}
            userData={userData}
            currentUser={currentUser}
            onSubmit={handleQuoteSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

PoolPosts.propTypes = {
  demoMode: PropTypes.bool,
  profileMedia: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      mediaUrl: PropTypes.string,
      mediaType: PropTypes.oneOf(['photo', 'video', 'audio', 'document', 'poll', 'text', 'quote']),
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
      user: PropTypes.string,
      userId: PropTypes.string,
      uploadDate: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),
      likes: PropTypes.number,
      comments: PropTypes.array,
      commentCount: PropTypes.number,
      views: PropTypes.number,
      quotePostCount: PropTypes.number,
      tags: PropTypes.arrayOf(PropTypes.string),
      trending: PropTypes.bool,
      width: PropTypes.number,
      height: PropTypes.number,
      isQuote: PropTypes.bool,
      originalPost: PropTypes.object,
    })
  ),
  profileUser: PropTypes.string,
  currentUser: PropTypes.string,
  compactMode: PropTypes.bool,
  onMediaSelect: PropTypes.func,
};

