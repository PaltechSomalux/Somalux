import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MegaphoneSimple, Plus, DotsThreeVertical } from 'phosphor-react';
import './Channels.css';
import { db, auth } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp, 
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment, 
} from 'firebase/firestore';
import { ChannelView } from './ChannelView';

export const Channels = ({ searchQuery = '', onChannelViewChange }) => {
  const [channels, setChannels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selected, setSelected] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null); // channel object
  const [swipeState, setSwipeState] = useState({ id: null, dx: 0, active: false });
  const [readMap, setReadMap] = useState({}); // { channelId: { lastReadCount, lastReadAt } }
  const [loading, setLoading] = useState(true);
  const [searchLocal, setSearchLocal] = useState(searchQuery);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep hash in sync so Navbar can hide on detail (#channel) and show on list (#channels)
  useEffect(() => {
    const target = selected ? '#channel' : '#channels';
    if (location.hash !== target) {
      navigate(target, { replace: true });
    }
    if (onChannelViewChange) {
      onChannelViewChange(!!selected);
    }
  }, [selected, navigate, location.hash]);

  // Deselect with Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'channels'), orderBy('lastPostAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChannels(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = (searchLocal || '').toLowerCase();
    setFiltered(
      channels.filter(c => (c.name || '').toLowerCase().includes(q))
    );
  }, [channels, searchLocal]);

  // Subscribe to per-channel read docs for current user to calculate unread counts
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsubs = [];
    filtered.forEach(ch => {
      const ref = doc(db, 'channels', ch.id, 'channelReads', uid);
      const unsub = onSnapshot(ref, (snap) => {
        const data = snap.data();
        setReadMap(prev => ({ ...prev, [ch.id]: data || {} }));
      }, () => {
        setReadMap(prev => ({ ...prev, [ch.id]: {} }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(fn => fn());
  }, [filtered.map(c => c.id).join('|'), auth.currentUser?.uid]);

  const formatRelative = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
    // same day
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isYesterday) return 'Yesterday';
    const twoDays = new Date(now); twoDays.setDate(now.getDate()-2);
    if (d > twoDays) return '2 days ago';
    return d.toLocaleDateString();
  };

  const createChannel = async () => {
    const user = auth.currentUser;
    if (!user) return alert('You must be logged in.');
    if (!newName.trim()) return alert('Enter a channel name.');
    try {
      const colorPool = ['#00A884', '#3E9EFF', '#FF7A59', '#8A63D2'];
      const avatarColor = colorPool[Math.floor(Math.random() * colorPool.length)];
      const ref = await addDoc(collection(db, 'channels'), {
        name: newName.trim(),
        description: newDesc.trim(),
        ownerUid: user.uid,
        ownerName: user.displayName || user.email?.split('@')[0] || 'Owner',
        followerIds: [user.uid],
        followersCount: 1,
        createdAt: serverTimestamp(),
        lastPostAt: serverTimestamp(),
        avatarColor,
      });
      setShowNewChannel(false);
      setNewName('');
      setNewDesc('');
      // select newly created
      setSelected({ id: ref.id, name: newName.trim(), description: newDesc.trim(), ownerUid: user.uid, followerIds: [user.uid], followersCount: 1, avatarColor });
    } catch (e) {
      console.error('Create channel failed:', e);
      alert('Failed to create channel.');
    }
  };

  const toggleFollow = async (ch) => {
    const user = auth.currentUser;
    if (!user) return alert('You must be logged in.');
    try {
      const ref = doc(db, 'channels', ch.id);
      const isFollowing = (ch.followerIds || []).includes(user.uid);
      await updateDoc(ref, isFollowing
        ? { followerIds: arrayRemove(user.uid), followersCount: increment(-1) }
        : { followerIds: arrayUnion(user.uid), followersCount: increment(1) }
      );
    } catch (e) {
      console.error('Follow toggle failed:', e);
    }
  };

  const renderSection = (title, items) => {
    const displayTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    return (
      <div className="channels-section">
        <div className="channels-section-title">{displayTitle}</div>
        {loading ? (
          <div className="channels-skeleton">
            {[...Array(5)].map((_, i) => (
              <div className="channel-skel-item" key={i}>
                <div className="skel-avatar" />
                <div className="skel-lines">
                  <div className="skel-line skel-name" />
                  <div className="skel-line skel-meta" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="channels-empty">
            <div className="channels-empty-icon"><MegaphoneSimple size={64} /></div>
            <h4>No channels</h4>
       
          </div>
        ) : (
          items.map(ch => {
            const isFollowing = (ch.followerIds || []).includes(auth.currentUser?.uid);
            const swiping = swipeState.active && swipeState.id === ch.id;
            const dx = swiping ? Math.min(0, swipeState.dx) : 0;
            const read = readMap[ch.id] || {};
            const total = ch.postsCount || 0;
            const lastRead = read.lastReadCount || 0;
            const unread = Math.max(0, total - lastRead);
            const lastTime = formatRelative(ch.lastPostAt);
            const preview = ch.lastPostType === 'image' ? '📷 image' : (ch.lastPostPreview || '');
            const displayName = (ch.name || '').charAt(0).toUpperCase() + (ch.name || '').slice(1).toLowerCase();
            return (
              <div key={ch.id} className={`channel-swipe-container ${swiping ? 'swiping' : ''}`} style={{ background: swiping ? 'rgba(255, 99, 71, 0.15)' : 'transparent' }}>
                <div
                  className={`channel-item ${selected?.id === ch.id ? 'active' : ''}`}
                  style={{ transform: `translateX(${dx}px)` }}
                  onClick={() => setSelected(ch)}
                  onTouchStart={(e) => {
                    const startX = e.touches[0].clientX;
                    setSwipeState({ id: ch.id, dx: 0, active: true, startX });
                  }}
                  onTouchMove={(e) => {
                    if (!swipeState.active || swipeState.id !== ch.id) return;
                    const currentX = e.touches[0].clientX;
                    const dxMove = currentX - swipeState.startX;
                    setSwipeState(prev => ({ ...prev, dx: dxMove }));
                  }}
                  onTouchEnd={() => {
                    if (swipeState.active && swipeState.id === ch.id && swipeState.dx < -80) {
                      // trigger confirm unfollow
                      setConfirmUnfollow(ch);
                    }
                    setSwipeState({ id: null, dx: 0, active: false });
                  }}
                >
                  <div className="channel-avatar" style={{ background: ch.avatarColor || '#1f2c33' }}>
                    {(ch.name || 'C')[0].toUpperCase()}
                  </div>
                  <div className="channel-info">
                    <div className="channel-row">
                      <div className="channel-name">{displayName}</div>
                    </div>
                    <div className="channel-row">
                      {isFollowing ? (
                        <>
                          <div className="channel-preview">{preview}</div>
                          {unread > 0 && <div className="channel-unread">{unread}</div>}
                        </>
                      ) : (
                        <div className="channel-followers">{ch.followersCount || 0} followers</div>
                      )}
                    </div>
                  </div>
                  <div className="channel-right-actions">
                    <div className="channel-time">{lastTime}</div>
                    {isFollowing ? (
                      <button 
                        className="channel-menu-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmUnfollow(ch);
                        }}
                      >
                        <DotsThreeVertical size={16} weight="bold" />
                      </button>
                    ) : (
                      <button 
                        className="channel-follow" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(ch);
                        }}
                      >
                        Follow
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderList = () => {
    const uid = auth.currentUser?.uid;
    const following = filtered.filter(c => (c.followerIds || []).includes(uid));
    const discover = filtered.filter(c => !(c.followerIds || []).includes(uid));
    return (
      <div className="channels-list">
        {renderSection('Following', following)}
        {renderSection('Channels', discover)}
      </div>
    );
  };

  return (
    <div className={`channels-container ${selected && isMobile ? 'detail-only' : ''}`}>
      {!selected || !isMobile ? (
        <div className="channels-pane list-pane">
          <div className="channels-header">
            <h2>Channels</h2>
            <div className="channels-search">
              <input
                value={searchLocal}
                onChange={(e) => setSearchLocal(e.target.value)}
                placeholder="Search channels"
              />
            </div>
          </div>
          {renderList()}
          <button
            className="channels-fab"
            onClick={() => setShowNewChannel(true)}
            aria-label="Create Channel"
            title="Create Channel"
          >
            +
          </button>
        </div>
      ) : null}

      {selected && (
        <div className="channels-pane detail-pane">
          <ChannelView channel={selected} onBack={() => setSelected(null)} />
        </div>
      )}

      {!selected && !isMobile && (
        <div className="channels-pane detail-pane">
          <div className="channels-empty-detail">
            <div className="channels-empty-icon"><MegaphoneSimple size={72} /></div>
            <h3>Select a channel</h3>
            <p>Choose a channel from the list to view updates here.</p>
          </div>
        </div>
      )}

      {confirmUnfollow && (
        <div className="channels-modal-overlay" onClick={() => setConfirmUnfollow(null)}>
          <div className="channels-modal" onClick={(e) => e.stopPropagation()}>
            <div className="channels-modal-header">
              <h3>Unfollow channel?</h3>
              <button className="channels-close" onClick={() => setConfirmUnfollow(null)}>×</button>
            </div>
            <div className="channels-modal-body">
              <p>You will stop receiving updates from <strong>{confirmUnfollow.name}</strong>.</p>
            </div>
            <div className="channels-modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmUnfollow(null)}>Cancel</button>
              <button className="btn-primary" onClick={async () => { await toggleFollow(confirmUnfollow); setConfirmUnfollow(null); }}>Unfollow</button>
            </div>
          </div>
        </div>
      )}



      {showNewChannel && (
        <div className="channels-modal-overlay" onClick={() => setShowNewChannel(false)}>
          <div className="channels-modal" onClick={(e) => e.stopPropagation()}>
            <div className="channels-modal-header">
              <h3>Create channel</h3>
              <button className="channels-close" onClick={() => setShowNewChannel(false)}>×</button>
            </div>
            <div className="channels-modal-body">
              <label className="channels-field">
                <span>Name</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Channel name" />
              </label>
              <label className="channels-field">
                <span>Description</span>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" />
              </label>
            </div>
            <div className="channels-modal-actions">
              <button className="btn-secondary" onClick={() => setShowNewChannel(false)}>Cancel</button>
              <button className="btn-primary" onClick={createChannel}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};