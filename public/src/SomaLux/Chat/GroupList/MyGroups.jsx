import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiLock, FiUsers, FiMoreVertical, FiStar, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { IoNotificationsOffOutline } from 'react-icons/io5';
import { BsCheck2All } from 'react-icons/bs';
import {Groups} from "../Group/Groups";
import { GroupCreation} from "../Group/GroupCreation";
import { useChatLock, ChatLockProvider } from '../ChatList/Components/utils/ChatLockProvider';
import { useSharedWebSocket, WebSocketProvider } from '../Group/WebSocketProvider';
import { useFCMToken } from '../hooks/useFCMToken';
import { unsubscribeFromGroupTopic } from '../ChatList/utils/fcmTopics';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  getDocs,
  collectionGroup,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import "./MyGroups.css";
import { GroupFolderList } from '../Group/Components/Folders/GroupFolderList';
import { GroupFolderDetail } from '../Group/Components/Folders/GroupFolderDetail';
import { GroupAddToFolderModal } from '../Group/Components/Folders/GroupAddToFolderModal';
import FloatingActionButton from '../ChatList/Components/FloatingActionButton';
import { FolderPickerModal } from '../ChatList/Components/Folders/FolderPickerModal';
import { FolderCreateModal } from '../ChatList/Components/Folders/FolderCreateModal';
import { FolderRenameModal } from '../ChatList/Components/Folders/FolderRenameModal';

// LocalStorage keys
const GROUPS_CACHE_KEY = 'myGroups_cached';
const GROUPS_CACHE_TIMESTAMP = 'myGroups_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const MyGroupsInner = ({ searchQuery: externalSearchQuery, onGroupViewChange }) => {
  // Initialize currentUser FIRST before any state or effects
  const currentUser = auth.currentUser;
  
  // Helper to ensure groups are always unique by ID
  const deduplicateGroups = (groupsArray) => {
    return Array.from(new Map(groupsArray.map(g => [g.id, g])).values());
  };

  const addGroupToSelectedFolder = async (id) => {
    if (!currentUser?.uid || !selectedFolder?.id || !id) return;
    try {
      // optimistic updates
      setSelectedFolder((prev) => prev ? { ...prev, members: Array.from(new Set([...(prev.members || []), id])) } : prev);
      setFolders((prev) => prev.map((f) => f.id === selectedFolder.id ? { ...f, members: Array.from(new Set([...(f.members || []), id])) } : f));
      const ref = doc(db, 'userGroupFolders', currentUser.uid, 'folders', selectedFolder.id);
      await updateDoc(ref, { members: arrayUnion(id) });
    } catch (e) {
      console.error('MyGroups: addGroupToSelectedFolder error', e);
    }
  };
  
  const [groups, setGroups] = useState(() => {
    // Load from cache immediately for instant display
    try {
      const cached = localStorage.getItem(GROUPS_CACHE_KEY);
      const timestamp = localStorage.getItem(GROUPS_CACHE_TIMESTAMP);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          console.log(`💾 Loaded ${parsed.length} groups from cache`);
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading cached groups:', error);
    }
    return [];
  });

  // Debug groups state changes and detect duplicates
  useEffect(() => {
    console.log('[MyGroups] Groups state updated:', groups.map(g => ({ id: g.id, name: g.name, unreadCount: g.unreadCount })));
    
    // Check for duplicate IDs
    const ids = groups.map(g => g.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error('⚠️ DUPLICATE GROUP IDs DETECTED!', {
        total: ids.length,
        unique: uniqueIds.size,
        duplicates: ids.filter((id, index) => ids.indexOf(id) !== index)
      });
      // Auto-fix duplicates
      setGroups(prev => deduplicateGroups(prev));
    }
  }, [groups]);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem(GROUPS_CACHE_KEY);
      const timestamp = localStorage.getItem(GROUPS_CACHE_TIMESTAMP);
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          return !(Array.isArray(parsed) && parsed.length > 0);
        }
      }
    } catch {}
    return true;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null);
  const [undoLeave, setUndoLeave] = useState(null); // { groupId, timer }
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  // Batched per-user read state across all groups
  const [readMap, setReadMap] = useState({}); // { [groupId]: { lastReadCount, lastReadAt } }

  // Per-user persisted preferences
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mygroups_pins')||'[]')); } catch { return new Set(); }
  });
  const [archivedIds, setArchivedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mygroups_archives')||'[]')); } catch { return new Set(); }
  });
  const [mutedIds, setMutedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mygroups_mutes')||'[]')); } catch { return new Set(); }
  });
  const [lockedIds, setLockedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mygroups_locks')||'[]')); } catch { return new Set(); }
  });
  const [showArchived, setShowArchived] = useState(false); // legacy flag (unused after tabs), kept to avoid wide refactor
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  // Folders state for Groups
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'folders'
  const [folders, setFolders] = useState([]); // {id,name,members:[]}
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderCreate, setShowFolderCreate] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [pendingGroupIds, setPendingGroupIds] = useState([]);
  const [showFolderRename, setShowFolderRename] = useState(false);
  const [foldersToDelete, setFoldersToDelete] = useState([]);
  const [showAddGroupsModal, setShowAddGroupsModal] = useState(false);
  
  const { pinExists, openSetPinModal, openUnlockModal, openConfirmLockModal, showToast } = useChatLock();
  
  // Use shared WebSocket
  const { 
    typingUsers, 
    unreadCounts, 
    lastMessages,
    setCurrentUser, 
    joinGroup, 
    leaveGroup, 
    setUnreadCounts,
    readyState 
  } = useSharedWebSocket();

  // Device FCM token for topic unsubscribe when leaving
  const { token: fcmToken } = useFCMToken();

  // Set current user in shared WebSocket (must be after useSharedWebSocket destructure)
  useEffect(() => {
    if (currentUser) {
      setCurrentUser({
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
        email: currentUser.email || null
      });
    }
  }, [currentUser, setCurrentUser]);

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Persist preference maps whenever they change
  useEffect(() => { localStorage.setItem('mygroups_pins', JSON.stringify(Array.from(pinnedIds))); }, [pinnedIds]);
  useEffect(() => { localStorage.setItem('mygroups_archives', JSON.stringify(Array.from(archivedIds))); }, [archivedIds]);
  useEffect(() => { localStorage.setItem('mygroups_mutes', JSON.stringify(Array.from(mutedIds))); }, [mutedIds]);
  useEffect(() => { localStorage.setItem('mygroups_locks', JSON.stringify(Array.from(lockedIds))); }, [lockedIds]);

  // Fetch groups from Firestore where current user is a member
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    console.log('📋 Fetching groups for user:', currentUser.uid);
    
    const groupsQuery = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', currentUser.uid),
      orderBy('lastActivity', 'desc')
    );

    const unsubscribe = onSnapshot(groupsQuery, async (snapshot) => {
      const groupsMap = new Map(); // Use Map to automatically deduplicate by ID
      const colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6'];

      for (const docSnap of snapshot.docs) {
        // Skip if already processed (safety check for duplicates)
        if (groupsMap.has(docSnap.id)) {
          console.warn(`Duplicate group detected in Firestore: ${docSnap.id}`);
          continue;
        }
        
        const data = docSnap.data();
        
        // Use denormalized last message from group doc (updated by backend)
        let lastMessage = 'No messages yet';
        let lastMessageTimestamp = data.createdAt?.toDate?.() || new Date();
        if (data.lastMessageText) {
          const senderName = data.lastMessageSenderName || 'Someone';
          lastMessage = `${senderName}: ${data.lastMessageText}`;
        }
        if (data.lastMessageTimestamp) {
          lastMessageTimestamp = data.lastMessageTimestamp.toDate ? data.lastMessageTimestamp.toDate() : new Date(data.lastMessageTimestamp);
        } else if (data.lastActivity?.toDate) {
          lastMessageTimestamp = data.lastActivity.toDate();
        }

        const totalCount = data.messagesCount || data.postsCount || 0;
        const read = readMap[docSnap.id] || {};
        const unread = Math.max(0, totalCount - (read.lastReadCount || 0));

        groupsMap.set(docSnap.id, {
          id: docSnap.id,
          ...data,
          lastMessage,
          lastMessageTimestamp,
          lastActive: formatTimestamp(lastMessageTimestamp),
          participants: data.members?.length || 0,
          groupPicture: data.icon || null,
          unreadCount: unread,
          isMuted: mutedIds.has(docSnap.id),
          isLocked: lockedIds.has(docSnap.id),
          isArchived: archivedIds.has(docSnap.id),
          isPinned: pinnedIds.has(docSnap.id),
          avatar: {
            color: colors[Math.floor(Math.random() * colors.length)],
            initials: data.name.split(' ').map(n => n[0]).join('').toUpperCase()
          }
        });
      }

      const groupsData = Array.from(groupsMap.values());
      setGroups(groupsData);
      setLoading(false);
      console.log('✅ Loaded', groupsData.length, 'groups');
      
      // Cache the groups
      try {
        localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(groupsData));
        localStorage.setItem(GROUPS_CACHE_TIMESTAMP, Date.now().toString());
        console.log('💾 Cached groups list');
      } catch (error) {
        console.error('Error caching groups:', error);
      }
    }, (error) => {
      console.error('Error fetching groups:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, pinnedIds, archivedIds, mutedIds, lockedIds, readMap]);

  // Memoize group IDs to prevent unnecessary re-renders
  // FIXED: Create stable string of IDs that only changes when IDs actually change
  const groupIdsString = useMemo(() => {
    const uniqueIds = [...new Set(groups.map(g => g.id))].sort();
    return uniqueIds.join(',');
  }, [groups.map(g => g.id).sort().join(',')]);
  
  const groupIds = useMemo(() => {
    return groupIdsString ? groupIdsString.split(',').filter(Boolean) : [];
  }, [groupIdsString]);
  
  // Join groups in shared WebSocket when list changes or WebSocket connects
  // FIXED: Only rejoin when groupIdsString actually changes, not on every render
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.uid;
    const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    
    // Join all groups (will queue if WS not ready)
    console.log(`📋 MyGroups: Joining ${groupIds.length} groups (WS state: ${readyState})`);
    groupIds.forEach(groupId => {
      joinGroup(groupId, userId, userName);
    });
    
    // FIXED: Don't leave groups on every change - only on unmount
    // This allows typing indicators to work even when navigating between list and chat
    return () => {
      // Only leave groups when component truly unmounts
      console.log(`📋 MyGroups: Component unmounting, leaving ${groupIds.length} groups`);
      if (!userId) return;
      groupIds.forEach(groupId => {
        leaveGroup(groupId, userId);
      });
    };
  }, [currentUser?.uid, groupIdsString, readyState]);

  // Update groups with shared unread counts - only if values actually changed
  useEffect(() => {
    if (Object.keys(unreadCounts).length === 0) return;
    
    setGroups(prev => {
      // Deduplicate first (use helper)
      const uniqueGroups = deduplicateGroups(prev);
      
      // Only update if unread count actually changed
      let hasChanges = false;
      const updated = uniqueGroups.map(group => {
        const newUnread = unreadCounts[group.id] ?? group.unreadCount ?? 0;
        if (newUnread !== group.unreadCount) {
          hasChanges = true;
          return { ...group, unreadCount: newUnread };
        }
        return group;
      });
      
      return hasChanges ? updated : prev;
    });
  }, [unreadCounts]);

  // Update groups with last messages from WebSocket
  useEffect(() => {
    if (Object.keys(lastMessages).length === 0) return;
    
    // Helper to format timestamp inline
    const formatTime = (date) => {
      if (!date) return '';
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (hours < 1) return 'Just now';
      if (hours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return date.toLocaleDateString();
    };
    
    setGroups(prev => {
      const uniqueGroups = deduplicateGroups(prev);
      
      let hasChanges = false;
      const updated = uniqueGroups.map(group => {
        const lastMsg = lastMessages[group.id];
        if (lastMsg) {
          const newLastMessage = `${lastMsg.senderName}: ${lastMsg.text}`;
          const newTimestamp = lastMsg.timestamp;
          
          // Only update if message or timestamp changed
          if (newLastMessage !== group.lastMessage || newTimestamp?.getTime() !== group.lastMessageTimestamp?.getTime()) {
            hasChanges = true;
            console.log(`📨 MyGroups: Updating last message for ${group.name}: "${newLastMessage}"`);
            return { 
              ...group, 
              lastMessage: newLastMessage,
              lastMessageTimestamp: newTimestamp,
              lastActive: formatTime(newTimestamp)
            };
          }
        }
        return group;
      });
      
      return hasChanges ? updated : prev;
    });
  }, [lastMessages]);

  // Remove Firestore typing listener: typing now handled via WebSocket above

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (onGroupViewChange) {
      onGroupViewChange(!!selectedGroup);
    }
  }, [selectedGroup, onGroupViewChange]);

  // Build groupsMap for folders detail
  const groupsMap = useMemo(() => {
    const m = new Map();
    groups.forEach(g => m.set(g.id, g));
    return m;
  }, [groups]);

  // Availability flags for tabs
  const hasFolders = folders.length > 0;
  const hasArchived = useMemo(() => groups.some(g => g.isArchived), [groups]);

  // Fallback to 'all' if current tab becomes unavailable
  useEffect(() => {
    // Allow folders tab to be accessible even when empty
    // if (activeTab === 'folders' && !hasFolders) setActiveTab('all');
    if (activeTab === 'archived' && !hasArchived) setActiveTab('all');
  }, [activeTab, hasFolders, hasArchived]);

  // Listen to user's group folders
  useEffect(() => {
    if (!currentUser?.uid) return;
    const coll = collection(db, 'userGroupFolders', currentUser.uid, 'folders');
    const unsub = onSnapshot(coll, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(list);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Set of all folder members to exclude from main list
  const allFolderMembers = useMemo(() => {
    const s = new Set();
    folders.forEach(f => (f.members || []).forEach(id => s.add(id)));
    return s;
  }, [folders]);

  // Consume deeplink by selecting the target group automatically
  useEffect(() => {
    let raw = null;
    try { raw = localStorage.getItem('group_message_deeplink'); } catch (_) {}
    if (!raw) return;
    let deeplink = null;
    try { deeplink = JSON.parse(raw); } catch (_) { deeplink = null; }
    if (!deeplink?.groupId) return;
    if (selectedGroup?.id === deeplink.groupId) return; // already opened
    const target = groups.find(g => g.id === deeplink.groupId);
    if (target) {
      setSelectedGroup(target);
    }
  }, [groups, selectedGroup?.id]);

  // Send read event when navigating back from group to sync read state
  useEffect(() => {
    if (!selectedGroup && currentUser && readyState === 1) {
      // Send a general read sync event when no group is selected
      // This helps ensure the list is in sync with the chat screen
      console.log('📖 List: User navigated back to list, syncing read state');
    }
  }, [selectedGroup, currentUser, readyState]);

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  // Folders: actions
  const handleCreateFolder = () => setShowFolderCreate(true);
  const createFolder = async (name) => {
    if (!currentUser?.uid || !name) return;
    try {
      const colRef = collection(db, 'userGroupFolders', currentUser.uid, 'folders');
      const folderRef = doc(colRef);
      await setDoc(folderRef, { name, members: [], createdAt: serverTimestamp() });
      setShowFolderCreate(false);
      setActiveTab('folders');
      if (pendingGroupIds.length > 0) {
        await updateDoc(folderRef, { members: arrayUnion(...pendingGroupIds) });
        setFolders(prev => prev.map(f => f.id === folderRef.id ? { ...f, members: Array.from(new Set([...(f.members||[]), ...pendingGroupIds])) } : f));
      }
      setPendingGroupIds([]);
    } catch (e) { console.error('MyGroups: createFolder error', e); }
  };

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    setActiveTab('folders');
  };

  const openFolderPickerForGroups = (groupIds) => {
    setPendingGroupIds(groupIds || []);
    setShowFolderPicker(true);
  };
  const confirmAddToFolders = async (folderIds) => {
    try {
      const ids = Array.isArray(folderIds) ? folderIds.slice(0, 3) : [];
      if (!currentUser?.uid || ids.length === 0 || pendingGroupIds.length === 0) return;
      let updatedAny = false;
      for (const fid of ids) {
        const ref = doc(db, 'userGroupFolders', currentUser.uid, 'folders', fid);
        const snap = await getDoc(ref);
        if (!snap.exists()) continue;
        await updateDoc(ref, { members: arrayUnion(...pendingGroupIds) });
        updatedAny = true;
      }
      if (updatedAny) {
        setFolders((prev) => prev.map(f => ids.includes(f.id) ? { ...f, members: Array.from(new Set([...(f.members || []), ...pendingGroupIds])) } : f));
      }
      setShowFolderPicker(false);
      setPendingGroupIds([]);
    } catch (e) { console.error('MyGroups: confirmAddToFolders error', e); }
  };

  const startCreateFolderFromPicker = () => {
    setShowFolderPicker(false);
    setShowFolderCreate(true);
  };

  const removeGroupsFromFolder = async (ids) => {
    if (!currentUser?.uid || !selectedFolder || !Array.isArray(ids) || ids.length === 0) return;
    try {
      const ref = doc(db, 'userGroupFolders', currentUser.uid, 'folders', selectedFolder.id);
      await updateDoc(ref, { members: arrayRemove(...ids) });
    } catch (e) { console.error('MyGroups: removeGroupsFromFolder error', e); }
  };

  const openFolderRename = (folder) => { setSelectedFolder(folder); setShowFolderRename(true); };
  const renameCurrentFolder = async (newName) => {
    if (!currentUser?.uid || !selectedFolder || !newName) return;
    try { await updateDoc(doc(db, 'userGroupFolders', currentUser.uid, 'folders', selectedFolder.id), { name: newName }); setShowFolderRename(false);} catch (e) {}
  };
  const openFolderDeleteConfirm = (foldersArr) => { setFoldersToDelete(foldersArr || (selectedFolder ? [selectedFolder] : [])); };
  const deleteCurrentFolder = async () => {
    if (!currentUser?.uid || foldersToDelete.length === 0) return;
    try {
      for (const f of foldersToDelete) { await deleteDoc(doc(db, 'userGroupFolders', currentUser.uid, 'folders', f.id)); }
      if (foldersToDelete.find(f => f.id === selectedFolder?.id)) setSelectedFolder(null);
      setFoldersToDelete([]);
    } catch (e) { console.error('MyGroups: deleteCurrentFolder error', e); }
  };

  // Folder pin/lock handlers (mirror 1:1)
  const toggleGroupFolderPin = async (folder) => {
    if (!currentUser?.uid || !folder?.id) return;
    try {
      const ref = doc(db, 'userGroupFolders', currentUser.uid, 'folders', folder.id);
      await updateDoc(ref, { isPinned: !folder.isPinned });
      setFolders((prev) => prev.map(f => f.id === folder.id ? { ...f, isPinned: !folder.isPinned } : f));
    } catch (e) {
      console.error('MyGroups: toggleGroupFolderPin error', e);
    }
  };

  const lockGroupFolders = async (foldersToLock) => {
    if (!currentUser?.uid || !foldersToLock?.length) return;
    if (!pinExists) {
      openSetPinModal(async () => {
        try {
          for (const f of foldersToLock) {
            await updateDoc(doc(db, 'userGroupFolders', currentUser.uid, 'folders', f.id), {
              isLocked: true,
              lockedAt: serverTimestamp(),
            });
          }
          showToast('Folder(s) locked', 'success');
        } catch (e) {
          console.error('GroupFolders: lock error', e);
          showToast('Failed to lock folders', 'error');
        }
      });
      return;
    }
    openConfirmLockModal(async () => {
      try {
        for (const f of foldersToLock) {
          await updateDoc(doc(db, 'userGroupFolders', currentUser.uid, 'folders', f.id), {
            isLocked: true,
            lockedAt: serverTimestamp(),
          });
        }
        showToast('Folder(s) locked', 'success');
      } catch (e) {
        console.error('GroupFolders: lock error', e);
        showToast('Failed to lock folders', 'error');
      }
    });
  };

  const unlockGroupFolders = async (foldersToUnlock) => {
    if (!currentUser?.uid || !foldersToUnlock?.length) return;
    openUnlockModal(async () => {
      try {
        for (const f of foldersToUnlock) {
          await updateDoc(doc(db, 'userGroupFolders', currentUser.uid, 'folders', f.id), {
            isLocked: false,
          });
        }
        showToast('Folder(s) unlocked', 'success');
      } catch (e) {
        console.error('GroupFolders: unlock error', e);
        showToast('Failed to unlock folders', 'error');
      }
    });
  };

  const handleMessageCreated = (newMessage) => {
    // Real-time updates handled by Firestore listener
  };
  
  const handleGroupCreated = (newGroup) => {
    console.log('✅ Group created:', newGroup);
    setSelectedGroup(newGroup);
  };
  
  const formatTimestamp = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleAllGroups = () => {
    setSearchQuery('');
  };

  const handleToggleArchived = () => {
    setShowArchived(!showArchived);
  };

  const handleToggleMute = (groupId) => {
    const next = new Set(mutedIds);
    if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
    setMutedIds(next);
    setGroups(prev => deduplicateGroups(prev.map(g => g.id === groupId ? { ...g, isMuted: next.has(groupId) } : g)));
  };

  const handleToggleLock = (groupId) => {
    const isCurrentlyLocked = lockedIds.has(groupId);
    if (isCurrentlyLocked) {
      // Unlock flow: prompt unlock, then remove from lockedIds
      openUnlockModal(() => {
        setLockedIds(prev => {
          const next = new Set(prev); next.delete(groupId); return next;
        });
        setGroups(prev => deduplicateGroups(prev.map(g => g.id === groupId ? { ...g, isLocked: false } : g)));
        showToast('Group unlocked', 'success');
      });
      return;
    }

    // Lock flow: ensure PIN exists, then confirm and lock
    const doLock = () => {
      openConfirmLockModal(() => {
        setLockedIds(prev => { const next = new Set(prev); next.add(groupId); return next; });
        setGroups(prev => deduplicateGroups(prev.map(g => g.id === groupId ? { ...g, isLocked: true } : g)));
      });
    };

    if (!pinExists) {
      openSetPinModal(() => {
        // After setting PIN successfully, proceed to confirm lock
        doLock();
      });
    } else {
      doLock();
    }
  };

  const handleTogglePin = (groupId) => {
    const next = new Set(pinnedIds);
    if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
    setPinnedIds(next);
    setGroups(prev => deduplicateGroups(prev.map(g => g.id === groupId ? { ...g, isPinned: next.has(groupId) } : g)));
  };

  const handleArchive = (groupId) => {
    const next = new Set(archivedIds);
    if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
    setArchivedIds(next);
    setGroups(prev => deduplicateGroups(prev.map(g => g.id === groupId ? { ...g, isArchived: next.has(groupId) } : g)));
    if (selectedGroup && selectedGroup.id === groupId) setSelectedGroup(null);
  };

  const handleDelete = (groupId) => {
    setConfirmDeleteGroup(groupId);
  };

  const handleConfirmDelete = async () => {
    const groupId = confirmDeleteGroup;
    setConfirmDeleteGroup(null);
    // Optimistically remove membership locally
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (selectedGroup?.id === groupId) setSelectedGroup(null);
    // Undo snackbar
    const timer = setTimeout(() => setUndoLeave(null), 5000);
    setUndoLeave({ groupId, timer });
    try {
      // Persist leave in Firestore
      const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
      await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayRemove(currentUser.uid) });
      // Immediately leave WS room
      try { leaveGroup(groupId, currentUser.uid); } catch {}
      // Unsubscribe this device from FCM topic
      try { if (fcmToken) await unsubscribeFromGroupTopic(groupId, fcmToken); } catch {}
    } catch (e) {
      console.error('Failed to leave group:', e);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteGroup(null);
  };

  const handleUndoLeave = async () => {
    if (!undoLeave) return;
    clearTimeout(undoLeave.timer);
    const { groupId } = undoLeave;
    setUndoLeave(null);
    try {
      const { doc, updateDoc, arrayUnion, getDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayUnion(currentUser.uid) });
      // Optionally re-fetch this group for immediate UI return
      const groupsRef = collection(db, 'groups');
      const snap = await getDocs(query(groupsRef, where('memberIds', 'array-contains', currentUser.uid)));
      // Minimal: do nothing else; live listener will bring it back
    } catch (e) {
      console.error('Failed to undo leave:', e);
    }
  };

  // Bulk actions
  const handleBulkArchive = () => {
    if (selectedIds.size === 0) return;
    const next = new Set(archivedIds);
    selectedIds.forEach(id => {
      if (next.has(id)) next.delete(id); else next.add(id);
    });
    setArchivedIds(next);
    setGroups(prev => deduplicateGroups(prev.map(g => next.has(g.id) ? { ...g, isArchived: true } : g)));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkLock = () => {
    if (selectedIds.size === 0) return;
    const doLock = () => {
      setLockedIds(prev => {
        const next = new Set(prev);
        selectedIds.forEach(id => { if (!next.has(id)) next.add(id); });
        return next;
      });
      setGroups(prev => deduplicateGroups(prev.map(g => selectedIds.has(g.id) ? { ...g, isLocked: true } : g)));
      setSelectionMode(false);
      setSelectedIds(new Set());
    };
    if (!pinExists) {
      openSetPinModal(() => doLock());
    } else {
      doLock();
    }
  };

  const handleBulkPin = () => {
    const count = selectedIds.size;
    if (count === 0 || count > 3) return; // hide button in UI when >3
    setPinnedIds(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => { if (!next.has(id)) next.add(id); });
      return next;
    });
    setGroups(prev => deduplicateGroups(prev.map(g => selectedIds.has(g.id) ? { ...g, isPinned: true } : g)));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkLeave = async () => {
    if (!currentUser) return;
    const ids = Array.from(selectedIds);
    setSelectionMode(false);
    setSelectedIds(new Set());
    // Optimistic remove
    setGroups(prev => prev.filter(g => !ids.includes(g.id)));
    try {
      const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
      await Promise.all(ids.map(id => updateDoc(doc(db, 'groups', id), { memberIds: arrayRemove(currentUser.uid) })));
      // Leave WS and unsubscribe topics for each
      ids.forEach(id => { try { leaveGroup(id, currentUser.uid); } catch {} });
      if (fcmToken) {
        await Promise.all(ids.map(id => unsubscribeFromGroupTopic(id, fcmToken).catch(() => {})));
      }
    } catch (e) {
      console.error('Bulk leave failed:', e);
    }
  };

  const filteredGroups = Array.from(
    new Map(
      groups
        .filter(group => (showArchived ? group.isArchived : !group.isArchived))
        .filter(group => !allFolderMembers.has(group.id))
        .map(g => [g.id, g])
    ).values()
  )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    })
    .filter(group => {
      const searchLower = searchQuery.toLowerCase();
      return (
        group.name.toLowerCase().includes(searchLower) ||
        group.lastMessage.toLowerCase().includes(searchLower) ||
        group.participants.toString().includes(searchQuery)
      );
    });

  const handleGroupClick = (groupId) => {
    if (selectionMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
        if (next.size === 0) setSelectionMode(false);
        return next;
      });
      return;
    }
    const group = groups.find(g => g.id === groupId);
    if (group.isLocked) {
      // Prompt unlock; on success, keep selection and open immediately
      openUnlockModal(() => {
        setLockedIds(prev => { const next = new Set(prev); next.delete(groupId); return next; });
        setGroups(prev => deduplicateGroups(prev.map(g => g.id === groupId ? { ...g, isLocked: false } : g)));
        setSelectedGroup(group);
      });
      return;
    }
    setSelectedGroup(group);
    
    // Reset unread count immediately using shared state
    setUnreadCounts(prev => ({
      ...prev,
      [groupId]: 0
    }));
    
    console.log(`📖 List: Reset unread count for group ${groupId}`);
  };

  const startSelection = (groupId) => {
    setSelectionMode(true);
    setSelectedIds(new Set([groupId]));
  };

  return (
    <div className={`mygroups-main-container ${isMobileView ? 'mobile-view' : 'desktop-view'}`}>
      {/* Group Creation Modal */}
      {showGroupCreation && (
        <GroupCreation 
          onClose={() => setShowGroupCreation(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
      
      {/* Always render group list on desktop; conditionally on mobile */}
      {(!isMobileView || !selectedGroup) ? (
        <div className={`group-list`} style={{ position: 'relative' }}>
          <div className="group-header">
            {selectionMode && selectedIds.size > 0 ? (
              <div className="group-bulk-bar">
                <div className="bulk-count">{selectedIds.size} selected</div>
                <div className="bulk-actions">
                  <button className="bulk-btn" title="Archive" onClick={handleBulkArchive}>Archive</button>
                  <button className="bulk-btn" title="Lock" onClick={handleBulkLock}>Lock</button>
                  {selectedIds.size <= 3 && (
                    <button className="bulk-btn" title="Pin (max 3)" onClick={handleBulkPin}>Pin</button>
                  )}
                  <button className="bulk-btn" title="Add to folders" onClick={() => openFolderPickerForGroups(Array.from(selectedIds))}>Add to folders</button>
                  <button className="bulk-btn danger" title="Leave" onClick={handleBulkLeave}>Leave</button>
                  <button className="bulk-btn" title="Cancel" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}>Cancel</button>
                </div>
              </div>
            ) : (
              (() => {
                if (activeTab === 'folders' && selectedFolder) {
                  return (
                    <div className="group-header-top" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button className="group-all-btn" onClick={() => { setSelectedFolder(null); }} title="Back" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', height: '40px', width: '40px', cursor: 'pointer', color: '#00a884' }}><FiArrowLeft size={32} /></button>
                      <h2 style={{ margin: 0, color: '#ccc', fontSize: '16px' }}>{selectedFolder?.name || ''}</h2>
                      <input
                        type="text"
                        placeholder={`Search ${selectedFolder?.name || 'folder'} ...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="group-search-input"
                        style={{ flex: 1, minWidth: 150 }}
                      />
                    </div>
                  );
                }
                const searchPlaceholder = activeTab === 'folders' ? 'Search folders ...' : (activeTab === 'archived' ? 'Search archived ...' : 'Search groups ...');
                return (
                  <>
                    <div className="group-header-top">
                      <h2>Groups</h2>
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="group-search-input"
                      />
                    </div>
                    <div className="group-header-buttons">
                      <button
                        className="group-all-btn"
                        onClick={() => setActiveTab('all')}
                        style={{
                          fontWeight: (activeTab === 'all') ? 600 : 500,
                          color: (activeTab === 'all') ? 'var(--accent, #00a884)' : '#ffffff',
                        }}
                      >
                        All Groups
                      </button>
                      <button
                        className="group-archive-btn"
                        onClick={() => setActiveTab('folders')}
                        style={{
                          fontWeight: (activeTab === 'folders') ? 600 : 500,
                          color: (activeTab === 'folders') ? 'var(--accent, #00a884)' : '#ffffff',
                        }}
                      >
                        Folders
                      </button>
                      {hasArchived && (
                        <button
                          className="group-archive-btn"
                          onClick={() => setActiveTab('archived')}
                          style={{
                            fontWeight: (activeTab === 'archived') ? 600 : 500,
                            color: (activeTab === 'archived') ? 'var(--accent, #00a884)' : '#ffffff',
                          }}
                        >
                          Archived
                        </button>
                      )}
                    </div>
                  </>
                );
              })()
            )}
          </div>

          {loading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="group-item skeleton">
                  <div className="group-avatar">
                    <div className="group-avatar-circle skeleton-avatar" />
                  </div>
                  <div className="group-chat-content">
                    <div className="group-chat-header">
                      <div className="group-chat-name">
                        <div className="skeleton-text" style={{ width: '60%' }} />
                      </div>
                      <div className="group-timestamp">
                        <div className="skeleton-text" style={{ width: '40px', height: '10px' }} />
                      </div>
                    </div>
                    <div className="group-chat-preview">
                      <div className="group-message-preview">
                        <div className="skeleton-text" style={{ width: '80%' }} />
                      </div>
                    </div>
                  </div>
                  <button className="group-menu-btn" style={{ visibility: 'hidden' }} />
                </div>
              ))}
            </>
          ) : activeTab === 'folders' ? (
            (selectedFolder ? (
              <>
                <GroupFolderDetail
                  folder={selectedFolder}
                  groupsMap={groupsMap}
                  onGroupClick={(g) => handleGroupClick(g.id)}
                  onAddGroups={() => setShowAddGroupsModal(true)}
                  onRemoveMembers={removeGroupsFromFolder}
                  searchQuery={searchQuery}
                />
                {/* FAB for adding groups into folder (scoped to left pane) */}
                <button className="fab-create-group" onClick={() => setShowAddGroupsModal(true)} title="Add groups to folder" style={{ position:'absolute', bottom:20, right:20 }}>+
                </button>
              </>
            ) : (
              <>
                {folders.length > 0 ? (
                  <>
                    <GroupFolderList
                      folders={folders}
                      onOpen={openFolder}
                      onRename={openFolderRename}
                      onDelete={openFolderDeleteConfirm}
                      groupsMap={groupsMap}
                      searchQuery={searchQuery}
                      onTogglePinFolder={toggleGroupFolderPin}
                      onLockFolders={lockGroupFolders}
                      onUnlockFolders={unlockGroupFolders}
                    />
                    <button className="fab-create-group" onClick={handleCreateFolder} title="Create folder">+</button>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#888',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <p style={{ fontSize: '16px', marginBottom: '10px' }}>No folders created yet</p>
                    <p style={{ fontSize: '14px', marginBottom: '20px', color: '#666' }}>Create a folder to organize your groups</p>
                    <button className="fab-create-group" onClick={handleCreateFolder} title="Create folder">+</button>
                  </div>
                )}
              </>
            ))
          ) : activeTab === 'archived' ? (
            (() => {
              const archivedList = groups
                .filter(g => g.isArchived)
                .filter(g => (g.name || '').toLowerCase().includes((searchQuery||'').toLowerCase()));
              return archivedList.length > 0 ? (
                <>
                  {archivedList.map(group => (
                    <GroupItem
                      key={group.id}
                      group={group}
                      typingUsers={typingUsers[group.id]}
                      onClick={() => handleGroupClick(group.id)}
                      onLongPress={() => startSelection(group.id)}
                      onToggleMute={() => handleToggleMute(group.id)}
                      onToggleLock={() => handleToggleLock(group.id)}
                      onTogglePin={() => handleTogglePin(group.id)}
                      onArchive={() => handleArchive(group.id)}
                      onDelete={() => handleDelete(group.id)}
                      onAddToFolders={() => openFolderPickerForGroups([group.id])}
                      selected={selectedIds.has(group.id)}
                    />
                  ))}
                </>
              ) : (
                <></>
              );
            })()
          ) : groups.length === 0 ? (
            <div className="group-empty-state">
              <FiUsers className="empty-state-icon" />
              <h5>No Groups </h5>
              <p></p>
              <button className="create-group-btn" onClick={() => setShowGroupCreation(true)}>
             Create Group
              </button>
            </div>
          ) : filteredGroups.length > 0 ? ( 
            <> 
              {filteredGroups.map(group => (
                <GroupItem 
                  key={group.id} 
                  group={group}
                  typingUsers={typingUsers[group.id]}
                  onClick={() => handleGroupClick(group.id)}
                  onLongPress={() => startSelection(group.id)}
                  onToggleMute={() => handleToggleMute(group.id)}
                  onToggleLock={() => handleToggleLock(group.id)}
                  onTogglePin={() => handleTogglePin(group.id)}
                  onArchive={() => handleArchive(group.id)}
                  onDelete={() => handleDelete(group.id)}
                  onAddToFolders={() => openFolderPickerForGroups([group.id])}
                  selected={selectedIds.has(group.id)}
                />
              ))}
              
              {/* Floating Action Button (shared) */}
              {(!isMobileView || !selectedGroup) && activeTab !== 'folders' && (
                <FloatingActionButton
                  contacts={[]}
                  onNewChat={() => {}}
                  onNewContact={() => {}}
                  onDeleteContact={() => {}}
                  onCreateGroup={() => setShowGroupCreation(true)}
                  onCreateFolder={handleCreateFolder}
                  isChatSelected={!!selectedGroup}
                  currentUser={currentUser}
                />
              )}
            </>
          ) : (
            <div className="group-no-results">
              <p>No groups match your search</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Always render group view on desktop; on mobile only when selected */}
      {(!isMobileView || selectedGroup) && (
        <div className={`group-view ${isMobileView ? 'full-width' : 'side-by-side'}`}>
          {selectedGroup ? (
            <Groups 
              initialGroup={selectedGroup}
              onBackClick={handleBackToGroups}
              isMobileView={isMobileView}
              onMessageCreated={handleMessageCreated}
            />
          ) : (
            <div className="group-empty-chat">
              <div className="group-empty-content">
                <FiUsers className="group-empty-icon" />
                <h3>Select a chat</h3>
                <p>Choose from your groups</p>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDeleteGroup && (
        <div className="confirm-modal-overlay" onClick={handleCancelDelete}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>Leave this group?</p>
            <div className="confirm-buttons">
              <button onClick={handleCancelDelete}>Cancel</button>
              <button onClick={handleConfirmDelete} className="delete-btn">Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for folders */}
      <FolderPickerModal
        show={showFolderPicker}
        folders={folders}
        onClose={() => { setShowFolderPicker(false); setPendingGroupIds([]); }}
        onConfirm={confirmAddToFolders}
        onCreateNew={startCreateFolderFromPicker}
      />
      <FolderCreateModal
        show={showFolderCreate}
        onClose={() => setShowFolderCreate(false)}
        onCreate={createFolder}
      />
      <FolderRenameModal
        show={showFolderRename}
        onClose={() => setShowFolderRename(false)}
        onRename={renameCurrentFolder}
        initialName={selectedFolder?.name}
      />
      <GroupAddToFolderModal
        show={showAddGroupsModal}
        onClose={() => setShowAddGroupsModal(false)}
        groups={groups}
        excludedIds={(selectedFolder?.members) || []}
        onAdd={addGroupToSelectedFolder}
        folderName={selectedFolder?.name}
      />

      {undoLeave && (
        <div className="confirm-modal-overlay" style={{ backgroundColor: 'transparent', pointerEvents: 'none' }}>
          <div className="confirm-modal" style={{ position: 'fixed', bottom: 20, pointerEvents: 'auto' }}>
            <p>You left the group.</p>
            <div className="confirm-buttons">
              <button onClick={handleUndoLeave}>Undo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MyGroups = (props) => (
  <WebSocketProvider>
    <ChatLockProvider>
      <MyGroupsInner {...props} />
    </ChatLockProvider>
  </WebSocketProvider>
);

const GroupItem = ({ 
  group,
  typingUsers,
  onClick,
  onLongPress,
  onToggleMute,
  onToggleLock,
  onTogglePin,
  onArchive,
  onDelete,
  onAddToFolders,
  selected = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({});
  const groupRef = useRef(null);
  const buttonRef = useRef(null);
  const pressTimer = useRef(null);
  
  // Debug typing data
  console.log(`[GroupItem] Group ${group.id} typingUsers:`, typingUsers);
  console.log(`[GroupItem] Group ${group.id} unreadCount:`, group.unreadCount);
  
  // Generate typing text
  const getTypingText = () => {
    if (!typingUsers) {
      console.log(`[GroupItem] No typingUsers for group ${group.id}`);
      return null;
    }
    const typingNames = Object.values(typingUsers);
    const count = typingNames.length;
    
    console.log(`[GroupItem] Group ${group.id} typing names:`, typingNames, 'count:', count);
    
    if (count === 0) return null;
    if (count === 1) return `${typingNames[0]} is typing...`;
    if (count === 2) return `${typingNames[0]} and ${typingNames[1]} are typing...`;
    return `${count} people are typing...`;
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(prev => {
      if (prev) {
        setMenuPosition({});
        return false;
      } else {
        if (buttonRef.current && groupRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const groupRect = groupRef.current.getBoundingClientRect();
          const top = buttonRect.bottom - groupRect.top;
          const rawRight = groupRect.right - buttonRect.right;
          const right = Math.max(rawRight, 12); // keep a bit away from edge
          setMenuPosition({
            top: `${top}px`,
            right: `${right}px`
          });
        }
        return true;
      }
    });
  };

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    setMenuPosition({});
    switch (action) {
      case 'pin':
        onTogglePin();
        break;
      case 'mute':
        onToggleMute();
        break;
      case 'lock':
        onToggleLock();
        break;
      case 'archive':
        onArchive();
        break;
      case 'addToFolders':
        if (onAddToFolders) onAddToFolders();
        break;
      case 'delete':
        onDelete();
        break;
      default:
        break;
    }
  };

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e) => {
      if (!groupRef.current) return;
      if (!groupRef.current.contains(e.target)) {
        setShowMenu(false);
        setMenuPosition({});
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') { setShowMenu(false); setMenuPosition({}); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showMenu]);

  // Long-press handling for selection mode
  const startPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      if (onLongPress) onLongPress();
    }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div 
      ref={groupRef}
      className={`group-item 
        ${group.unreadCount > 0 ? 'unread' : ''} 
        ${group.isMuted ? 'muted' : ''} 
        ${group.isLocked ? 'locked' : ''}
        ${group.isPinned ? 'pinned' : ''}
        ${selected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
    >
      <div className="group-avatar">
        <div 
          className="group-avatar-circle" 
          style={{ backgroundColor: group.avatar.color }}
        >
          {group.groupPicture ? (
            <img 
              src={group.groupPicture} 
              alt={group.name}
              className="group-avatar-img"
            />
          ) : (
            <span>{group.avatar.initials}</span>
          )}
        
          {group.isLocked && (
            <div className="group-lock-overlay">
              <FiLock />
            </div>
          )}
          {group.isPinned && (
            <div className="group-pin-overlay">
              <FiStar />
            </div>
          )}
        </div>
      </div>

      <div className="group-chat-content">
        <div className="group-chat-header">
          <div className="group-chat-name">
            <span>{group.name}</span>
            {group.isMuted && (
              <IoNotificationsOffOutline className="group-mute-icon" />
            )}
          </div>
          <div className="group-timestamp">
            {group.lastActive}
          </div>
        </div>

        <div className="group-chat-preview">
          <div className="group-message-preview">
            {!getTypingText() && (
              <div className="group-status-icons">
                {group.lastMessageStatus === 'read' && (
                  <BsCheck2All className="group-read-icon" />
                )}
              </div>
            )}
            
            <span className={`group-message-text ${getTypingText() ? 'typing' : ''}`}>
              {getTypingText() || group.lastMessage}
            </span>
          </div>

          {group.unreadCount > 0 && !getTypingText() && (
            <div className="group-unread-badge">
              {group.unreadCount > 99 ? '99+' : group.unreadCount}
            </div>
          )}
        </div>
      </div>

      <button ref={buttonRef} className="group-menu-btn" onClick={handleMenuToggle}>
        <FiMoreVertical />
      </button>

      {showMenu && (
        <div className="group-context-menu" style={menuPosition}>
          <div className="context-menu-item" onClick={(e) => handleMenuAction('pin', e)}>
            {group.isPinned ? 'Unpin Group' : 'Pin Group'}
          </div>
          <div className="context-menu-item" onClick={(e) => handleMenuAction('mute', e)}>
            {group.isMuted ? 'Unmute Group' : 'Mute Group'}
          </div>
          <div className="context-menu-item" onClick={(e) => handleMenuAction('lock', e)}>
            {group.isLocked ? 'Unlock Group' : 'Lock Group'}
          </div>
          <div className="context-menu-item" onClick={(e) => handleMenuAction('addToFolders', e)}>
            Add to folders
          </div>
          <div className="context-menu-item" onClick={(e) => handleMenuAction('archive', e)}>
            {group.isArchived ? 'Unarchive Group' : 'Archive Group'}
          </div>
          <div className="context-menu-item delete" onClick={(e) => handleMenuAction('delete', e)}>
            Delete Group
          </div>
        </div>
      )}
    </div> 
  );
};