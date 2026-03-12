import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, PaperPlaneRight, DotsThreeVertical, DotsThree, Trash } from 'phosphor-react';
import { FiPaperclip } from 'react-icons/fi';
import { FaMicrophone, FaPaperPlane, FaCamera, FaImage, FaFileAlt, FaPoll, FaUserCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { format, isToday, isYesterday, differenceInDays, startOfDay, isSameDay } from 'date-fns';
import { db, auth, storage } from '../firebase';
import './ChannelView.css';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  setDoc,
  deleteField,
} from 'firebase/firestore';
import { ChannelInfo } from './ChannelInfo';
import { PollModal } from '../Cult/PollModal';

export const ChannelView = ({ channel, onBack }) => {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid && channel?.ownerUid === currentUid;
  const [following, setFollowing] = useState(false);
  const [mode, setMode] = useState('messages'); // 'messages' | 'info'
  const listRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [localDesc, setLocalDesc] = useState(channel?.description || '');
  const [followersCountOverride, setFollowersCountOverride] = useState(null);

  // keep local description in sync when prop changes
  useEffect(() => {
    setLocalDesc(channel?.description || '');
    setFollowersCountOverride(null);
  }, [channel?.description]);
  const fileInputRef = useRef(null);
  const canPost = isOwner;
  const [showPostActions, setShowPostActions] = useState(null); // postId
  const [showReactModal, setShowReactModal] = useState(null); // postId
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const postsPerPage = 10; // Number of posts to show initially
  const displayedPosts = showAllPosts ? posts : posts.slice(Math.max(posts.length - postsPerPage, 0));
  const [expandedWords, setExpandedWords] = useState({}); // { [postId]: number of visible words }
  const BASE_WORDS = 60;

  // Live posts
  useEffect(() => {
    if (!channel?.id) return;
    const q = query(collection(db, 'channels', channel.id, 'posts'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [channel?.id]);

  // Auto-scroll to bottom when posts change (newest at bottom)
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [posts]);

  // Dismiss header menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showMenu]);

  // Mark channel as read for this user when viewing messages and when posts update
  useEffect(() => {
    if (!channel?.id || !currentUid || mode !== 'messages') return;
    const ref = doc(db, 'channels', channel.id, 'channelReads', currentUid);
    const write = async () => {
      try {
        await updateDoc(ref, { lastReadAt: serverTimestamp(), lastReadCount: posts.length, userId: currentUid });
      } catch (_) {
        await setDoc(ref, { lastReadAt: serverTimestamp(), lastReadCount: posts.length, userId: currentUid });
      }
    };
    write();
  }, [channel?.id, currentUid, mode, posts.length]);

  // Follow state
  useEffect(() => {
    if (!channel?.id || !currentUid) { setFollowing(false); return; }
    // Derive from passed channel object if available
    setFollowing((channel.followerIds || []).includes(currentUid));
  }, [channel?.id, channel?.followerIds, currentUid]);

  const baseFollowersCount = () => {
    if (typeof channel?.followersCount === 'number') return channel.followersCount;
    return (channel?.followerIds || []).length;
  };

  const formattedFollowers = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
    return `${n}`;
  };

  const handleSend = async () => {
    if (!canPost) return;
    const content = text.trim();
    if (!content) return;
    try {
      await addDoc(collection(db, 'channels', channel.id, 'posts'), {
        content,
        createdAt: serverTimestamp(),
        authorUid: currentUid,
        type: 'text'
      });
      const preview = content.slice(0, 120);
      await updateDoc(doc(db, 'channels', channel.id), {
        lastPostAt: serverTimestamp(),
        lastPostPreview: preview,
        lastPostType: 'text',
        postsCount: increment(1),
      });
      setText('');
    } catch (e) {
      console.error('Failed to post:', e);
      alert('Failed to post');
    }
  };

  const handleAttachClick = () => setShowAttachmentMenu(!showAttachmentMenu);

  const handleFilesSelected = async (e) => {
    if (!canPost) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      try {
        const path = `channels/${channel.id}/${Date.now()}-${file.name}`;
        const r = storageRef(storage, path);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        const isImage = file.type.startsWith('image/');
        await addDoc(collection(db, 'channels', channel.id, 'posts'), {
          content: isImage ? '' : file.name,
          mediaUrl: url,
          mediaType: file.type,
          createdAt: serverTimestamp(),
          authorUid: currentUid,
          type: isImage ? 'image' : 'file'
        });
        await updateDoc(doc(db, 'channels', channel.id), {
          lastPostAt: serverTimestamp(),
          lastPostPreview: isImage ? 'Image' : file.name.slice(0, 40),
          lastPostType: isImage ? 'image' : 'file',
          postsCount: increment(1),
        });
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to upload file');
      }
    }
    // reset input
    e.target.value = '';
  };

  const handleFileSelection = (type) => {
    const input = fileInputRef.current;
    if (!input) return;
    
    switch (type) {
      case 'camera':
        input.accept = 'image/*';
        input.capture = 'environment';
        break;
      case 'gallery':
        input.accept = 'image/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.zip';
        break;
      default:
        input.accept = 'image/*,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }
    
    input.click();
    setShowAttachmentMenu(false);
  };

  const handleCreatePoll = async (poll) => {
    if (!canPost) return;
    try {
      await addDoc(collection(db, 'channels', channel.id, 'posts'), {
        content: poll.question,
        poll: poll,
        createdAt: serverTimestamp(),
        authorUid: currentUid,
        type: 'poll'
      });
      await updateDoc(doc(db, 'channels', channel.id), {
        lastPostAt: serverTimestamp(),
        lastPostPreview: `Poll: ${poll.question.slice(0, 80)}`,
        lastPostType: 'poll',
        postsCount: increment(1),
      });
      setShowPollModal(false);
    } catch (e) {
      console.error('Failed to create poll:', e);
      alert('Failed to create poll');
    }
  };

  const submitReport = async () => {
    const user = auth.currentUser;
    if (!user) return alert('You must be logged in.');
    if (!reportReason.trim()) return alert('Please provide a reason.');
    try {
      await addDoc(collection(db, 'channelReports'), {
        channelId: channel.id,
        channelName: channel.name,
        reporterUid: user.uid,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
        createdAt: serverTimestamp(),
      });
      setShowReport(false);
      setReportReason('');
      setReportDetails('');
      alert('Report submitted.');
    } catch (e) {
      console.error('Report failed:', e);
      alert('Failed to submit report');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await updateDoc(doc(db, 'channels', channel.id, 'posts', postId), { deleted: true });
      await updateDoc(doc(db, 'channels', channel.id), { postsCount: increment(-1) });
      setShowPostActions(null);
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete post');
    }
  };

  const formatPostTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    
    // Always show time and date like WhatsApp
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return format(date, 'h:mm a');
    } else if (differenceInDays(new Date(), date) < 7) {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const shouldShowDayBreak = (currentPost, previousPost) => {
    if (!previousPost) return false;
    if (!currentPost.createdAt?.toDate || !previousPost.createdAt?.toDate) return false;
    
    const currentDate = currentPost.createdAt.toDate();
    const prevDate = previousPost.createdAt.toDate();
    
    return !isSameDay(currentDate, prevDate);
  };

  const getDayBreakLabel = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const toggleFollow = async () => {
    const user = auth.currentUser;
    if (!user) return alert('You must be logged in.');
    try {
      const ref = doc(db, 'channels', channel.id);
      if (following) {
        await updateDoc(ref, { followerIds: arrayRemove(user.uid), followersCount: increment(-1) });
        setFollowing(false);
        setFollowersCountOverride((prev) => {
          const base = prev ?? baseFollowersCount();
          return Math.max(0, base - 1);
        });
      } else {
        await updateDoc(ref, { followerIds: arrayUnion(user.uid), followersCount: increment(1) });
        setFollowing(true);
        setFollowersCountOverride((prev) => {
          const base = prev ?? baseFollowersCount();
          return base + 1;
        });
      }
    } catch (e) {
      console.error('Follow toggle failed:', e);
    }
  };

  const reactionEmojis = ['👍','❤️','😂','🎉','🔥','😍','👏','💯','🙌','✨'];
  const reactToPost = async (postId, emoji) => {
    try {
      const ref = doc(db, 'channels', channel.id, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const currentReaction = post?.userReactions?.[currentUid];
      
      if (currentReaction === emoji) {
        // Remove reaction
        await updateDoc(ref, {
          [`reactions.${currentReaction}`]: increment(-1),
          [`userReactions.${currentUid}`]: deleteField()
        });
      } else if (currentReaction) {
        // Switch to new reaction
        await updateDoc(ref, {
          [`reactions.${currentReaction}`]: increment(-1),
          [`reactions.${emoji}`]: increment(1),
          [`userReactions.${currentUid}`]: emoji
        });
      } else {
        // Add new reaction
        await updateDoc(ref, {
          [`reactions.${emoji}`]: increment(1),
          [`userReactions.${currentUid}`]: emoji
        });
      }
      setShowReactModal(null);
    } catch (e) {
      console.error('Failed to react:', e);
    }
  };

  return (
    <div className="channel-view">
      {mode === 'messages' && (
      <div className="channel-view-header" onClick={() => setMode('info')}>
        <div className="left">
          <button className="cv-back" onClick={(e) => { e.stopPropagation(); onBack(); }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="cv-title" style={{ background: channel.avatarColor || '#1f2c33' }}>
            {(channel.name || 'C')[0].toUpperCase()}
          </div>
          <div className="cv-meta">
            <div className="name">{channel.name}</div>
            <div className="sub">{formattedFollowers(followersCountOverride ?? baseFollowersCount())} followers</div>
          </div>
        </div>
        <div className="right" onClick={(e) => e.stopPropagation()} ref={menuRef}>
          {!isOwner && (
            <button 
              className={`cv-follow-btn ${following ? 'following' : ''}`} 
              onClick={toggleFollow}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="cv-menu-btn" onClick={() => setShowMenu(v => !v)} aria-label="Menu">
            <DotsThreeVertical size={22} />
          </button>
          {showMenu && (
            <div className="cv-menu">
              <div className="cv-menu-item" onClick={() => {
                setShowMenu(false);
                const shareData = {
                  title: channel.name,
                  text: `Check out ${channel.name} channel`,
                  url: `${window.location.origin}${window.location.pathname}#channels`
                };
                if (navigator.share) navigator.share(shareData); else {
                  navigator.clipboard?.writeText(shareData.url);
                  alert('Channel link copied to clipboard');
                }
              }}>Share</div>
              <div className="cv-menu-item" onClick={() => { setShowMenu(false); setShowReport(true); }}>Report</div>
              <div className="cv-menu-item" onClick={() => { setShowMenu(false); setMode('info'); }}>Channel info</div>
            </div>
          )}
        </div>
      </div>
      )}

      <div className="channel-views">
        <div className={`view info-view ${mode === 'info' ? 'active' : ''}`}>
          <ChannelInfo
            channel={channel}
            isOwner={isOwner}
            following={following}
            onToggleFollow={toggleFollow}
            localDesc={localDesc}
            onSaveDescription={async (desc) => {
              try {
                await updateDoc(doc(db, 'channels', channel.id), { description: desc });
                setLocalDesc(desc);
                setMode('messages');
              } catch (e) {
                console.error('Save description failed:', e);
                alert('Failed to save description');
              }
            }}
            onBack={() => setMode('messages')}
          />
        </div>
        <div className={`view messages-view ${mode === 'messages' ? 'active' : ''}`}>
          <div className="channel-posts" ref={listRef}>
        {/* Pinned description at the top */}
        {localDesc && (
          <div className="cv-desc-pinned">
            {localDesc}
          </div>
        )}

        {/* Show More / Show Less Button */}
        {posts.length > postsPerPage && (
          <div className="cv-show-more-wrapper">
            <button className="cv-show-more-btn" onClick={() => setShowAllPosts(v => !v)}>
              {showAllPosts ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}

        {displayedPosts.length === 0 ? (
          <div className="cv-empty">No posts yet</div>
        ) : (
          displayedPosts.filter(p => !p.deleted).map((p, index, arr) => {
            const myReaction = (p.userReactions && currentUid) ? p.userReactions[currentUid] : null;
            const previousPost = index > 0 ? arr[index - 1] : null;
            const showDayBreak = shouldShowDayBreak(p, previousPost);
            
            // Get reactions that have been used
            const usedReactions = reactionEmojis.filter(emoji => 
              p.reactions && p.reactions[emoji] > 0
            );
            
            return (
              <React.Fragment key={p.id}>
                {showDayBreak && (
                  <div className="cv-day-break">
                    <span className="cv-day-label">{getDayBreakLabel(p.createdAt)}</span>
                  </div>
                )}
                
                <div className="cv-post">
                  <div className="cv-post-header">
                    <button 
                      className="cv-post-menu-btn" 
                      onClick={() => setShowPostActions(showPostActions === p.id ? null : p.id)}
                      aria-label="Post actions"
                    >
                      <DotsThree size={20} weight="bold" />
                    </button>
                  </div>
                  
                  <div className="cv-post-media-wrapper">
                    {p.type === 'image' && p.mediaUrl ? (
                      <>
                        <img className="cv-post-image" src={p.mediaUrl} alt="uploaded" />
                        <span className="cv-post-time">{formatPostTime(p.createdAt)}</span>
                      </>
                    ) : p.type === 'file' && p.mediaUrl ? (
                      <>
                        <a className="cv-post-file" href={p.mediaUrl} target="_blank" rel="noreferrer">📎 {p.content || 'File'}</a>
                        <span className="cv-post-time">{formatPostTime(p.createdAt)}</span>
                      </>
                    ) : (
                      <>
                        <div className="cv-post-content">
                          {(() => {
                            const content = p.content || '';
                            const words = content.split(/\s+/).filter(Boolean);
                            const isLong = words.length > BASE_WORDS;
                            const visible = expandedWords[p.id] ?? BASE_WORDS;
                            const clamped = Math.min(visible, words.length);
                            const isFullyVisible = clamped >= words.length;
                            const textToShow = words.slice(0, clamped).join(' ');
                            return (
                              <>
                                {textToShow}
                                {!isFullyVisible && '…'}

                                {isLong && !isFullyVisible && (
                                  <button
                                    className="cv-show-more-less"
                                    onClick={() => setExpandedWords(prev => {
                                      const current = prev[p.id] ?? BASE_WORDS;
                                      const next = Math.min(current * 2, words.length);
                                      return { ...prev, [p.id]: next };
                                    })}
                                  >
                                    Show more
                                  </button>
                                )}

                                {isLong && isFullyVisible && (
                                  <button
                                    className="cv-show-more-less"
                                    onClick={() => setExpandedWords(prev => ({ ...prev, [p.id]: BASE_WORDS }))}
                                  >
                                    Show less
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <span className="cv-post-time">{formatPostTime(p.createdAt)}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Reactions Display - Now separate footer without time */}
                  {usedReactions.length > 0 && (
                    <div className="cv-post-footer">
                      <div className="cv-reactions-display">
                        {usedReactions.map(em => (
                          <div 
                            key={em} 
                            className={`cv-reaction-chip ${myReaction === em ? 'my-reaction' : ''}`}
                            onClick={() => setShowReactModal(p.id)}
                          >
                            <span className="cv-reaction-emoji">{em}</span>
                            <span className="cv-reaction-count">{p.reactions[em]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Post Actions Modal */}
                  {showPostActions === p.id && (
                    <div className="cv-post-actions-modal">
                      <button 
                        className="cv-action-item"
                        onClick={() => {
                          setShowReactModal(p.id);
                          setShowPostActions(null);
                        }}
                      >
                        <span className="cv-action-icon">😊</span>
                        <span>React</span>
                      </button>
                      
                      {isOwner && p.authorUid === currentUid && (
                        <button 
                          className="cv-action-item cv-action-danger"
                          onClick={() => deletePost(p.id)}
                        >
                          <Trash size={18} className="cv-action-icon" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* React Modal - Horizontal Emoji Picker */}
                  {showReactModal === p.id && (
                    <>
                      <div className="cv-react-backdrop" onClick={() => setShowReactModal(null)} />
                      <div className="cv-react-modal">
                        {reactionEmojis.map(em => (
                          <button
                            key={em}
                            className={`cv-react-emoji-btn ${myReaction === em ? 'selected' : ''}`}
                            onClick={() => reactToPost(p.id, em)}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
          </div>
        </div>
      </div>

      {mode === 'messages' && isOwner && (
        <div className="channel-composer-vibe">
          {showAttachmentMenu && (
            <div className="channel-attachment-options-vibe">
              <div className="channel-options-grid-vibe">
                <div className="channel-option-vibe" onClick={() => handleFileSelection('camera')}>
                  <div className="channel-option-icon camera-vibe">
                    <FaCamera />
                  </div>
                  <span>Camera</span>
                </div>
                <div className="channel-option-vibe" onClick={() => handleFileSelection('gallery')}>
                  <div className="channel-option-icon gallery-vibe">
                    <FaImage />
                  </div>
                  <span>Gallery</span>
                </div>
                <div className="channel-option-vibe" onClick={() => handleFileSelection('document')}>
                  <div className="channel-option-icon document-vibe">
                    <FaFileAlt />
                  </div>
                  <span>Document</span>
                </div>
                <div className="channel-option-vibe" onClick={() => { setShowPollModal(true); setShowAttachmentMenu(false); }}>
                  <div className="channel-option-icon poll-vibe">
                    <FaPoll />
                  </div>
                  <span>Vote</span>
                </div>
                <div className="channel-option-vibe">
                  <div className="channel-option-icon contact-vibe">
                    <FaUserCircle />
                  </div>
                  <span>Contact</span>
                </div>
                <div className="channel-option-vibe">
                  <div className="channel-option-icon location-vibe">
                    <FaMapMarkerAlt />
                  </div>
                  <span>Location</span>
                </div>
              </div>
            </div>
          )}

          <div className="channel-composer-content-container">
            <div className="channel-composer-content-vibe">
              <input type="file" multiple accept="image/*,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ref={fileInputRef} style={{ display: 'none' }} onChange={handleFilesSelected} />
              
              <button
                className="channel-icon-button-vibe"
                onClick={handleAttachClick}
                aria-label="Attachment options"
              >
               
                📎
              </button>

              <div className="channel-input-wrapper">
                <input
                  className="channel-message-input-vibe"
                  placeholder="Write an update"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                />
              </div>

              <button
                className="channel-send-button-vibe"
                onClick={handleSend}
                aria-label="Send"
                disabled={!canPost || !text.trim()}
              >
                <FaPaperPlane /> te
              </button>
            </div>
          </div>
        </div>
      )}


      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onCreatePoll={handleCreatePoll}
          currentUser={{ uid: currentUid, id: currentUid }}
        />
      )}

      {showReport && (
        <div className="channels-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="channels-modal" onClick={(e) => e.stopPropagation()}>
            <div className="channels-modal-header">
              <h3>Report channel</h3>
              <button className="channels-close" onClick={() => setShowReport(false)}>×</button>
            </div>
            <div className="channels-modal-body">
              <label className="channels-field">
                <span>Reason</span>
                <input value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Reason" />
              </label>
              <label className="channels-field">
                <span>Details</span>
                <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Provide details" />
              </label>
            </div>
            <div className="channels-modal-actions">
              <button className="btn-secondary" onClick={() => setShowReport(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitReport}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}