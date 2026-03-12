// Full ChatMe.jsx - With fixes for status updates
import React, { useEffect, useMemo, useRef, useState ,useCallback} from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  getDocs,
  getDoc,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  where,
  orderBy,
  limit,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useChatLock } from './Components/utils/ChatLockProvider';
import { FormatTime, FormatMessageTime } from './Components/TimeFormatters';
import { ChatList } from './Components/ChatList';
import { EmptyChatView } from './Components/EmptyChatView';
import { ProfileViewer } from './Components/ProfileViewer';
import { FloatingActionButton } from './Components/FloatingActionButton';
import { Chat } from '../Kiss/Chat';
import { GroupCreation } from '../Cult/GroupCreation';
import { ChatCache } from './utils/chatCache';
import useWebSocket from 'react-use-websocket';
import './ChatMe.css';
import { useFCMToken } from '../hooks/useFCMToken';
import { subscribeToGroupTopic } from './utils/fcmTopics';
import { FolderCreateModal } from './Components/Folders/FolderCreateModal';
import { FolderList } from './Components/Folders/FolderList';
import { FolderDetail } from './Components/Folders/FolderDetail';
import { AddToFolderModal } from './Components/Folders/AddToFolderModal';
import { FolderRenameModal } from './Components/Folders/FolderRenameModal';
import { FiArrowLeft } from 'react-icons/fi';
import { FolderPickerModal } from './Components/Folders/FolderPickerModal';

const yourselfChatId = 'yourself';

export const ChatMe = ({ onChatSelect = () => { }, searchQuery = '', isMobileView = false, onProfileViewerChange = () => { }, user }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [typingUsers, setTypingUsers] = useState({});  // FIXED: Real updates from Chat via callback
  const [onlineUsers, setOnlineUsers] = useState(new Set());  // FIXED: Real updates from Chat via callback
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'folders'
  const [folders, setFolders] = useState([]); // {id,name,members:[]}
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderCreate, setShowFolderCreate] = useState(false);
  const [showAddToFolder, setShowAddToFolder] = useState(false);
  const [showFolderRename, setShowFolderRename] = useState(false);
  const [showFolderDeleteConfirm, setShowFolderDeleteConfirm] = useState(false);
  const [foldersToDelete, setFoldersToDelete] = useState([]);
  // Bulk add to folder flow
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [pendingSelectedChatUids, setPendingSelectedChatUids] = useState([]);
  const [pendingCreateAndAdd, setPendingCreateAndAdd] = useState(false);
  // Add this state near other states
  // const [navigationContext, setNavigationContext] = useState('main'); // 'main' | 'folder'
  const [cameFromFolder, setCameFromFolder] = useState(false);
  const [fromFolderId, setFromFolderId] = useState(null);
  const [fromFolderSnapshot, setFromFolderSnapshot] = useState(null);

  // ----- Folders: helpers (top-level hooks) -----
  const allFolderMembers = React.useMemo(() => {
    const s = new Set();
    folders.forEach((f) => (f.members || []).forEach((m) => s.add(m)));
    return s;
  }, [folders]);

  const folderChatsMap = React.useMemo(() => {
    const m = new Map();
    chats.forEach((c) => m.set(c.uid, c));
    return m;
  }, [chats]);

  const handleCreateFolder = () => setShowFolderCreate(true);

  const createFolder = async (name) => {
    if (!currentUser?.uid || !name) return;
    try {
      const colRef = collection(db, 'userFolders', currentUser.uid, 'folders');
      const docRef = doc(colRef);
      await setDoc(docRef, {
        name,
        members: [],
        createdAt: serverTimestamp(),
      });
      setShowFolderCreate(false);
      setActiveTab('folders');
      // If coming from bulk create-and-add, append members now
      if (pendingCreateAndAdd && pendingSelectedChatUids.length > 0) {
        try {
          await updateDoc(docRef, { members: arrayUnion(...pendingSelectedChatUids) });
          // also update local state optimistically
          setFolders((prev) => prev.map(f => f.id === docRef.id ? { ...f, members: Array.from(new Set([...(f.members||[]), ...pendingSelectedChatUids])) } : f));
        } catch (e) {
          console.error('ChatMe: add members to new folder error', e);
        }
      }
      setPendingCreateAndAdd(false);
    } catch (e) {
      console.error('ChatMe: createFolder error', e);
    }
  };

  // Auto-open DM intent coming from group message action
  useEffect(() => {
    const tryConsumeIntent = async () => {
      let raw;
      try {
        raw = localStorage.getItem('chat_dm_intent');
      } catch (_) {}
      if (!raw) return;
      let intent;
      try {
        intent = JSON.parse(raw);
      } catch (_) {
        intent = null;
      }
      if (!intent?.contactUid || !currentUser?.uid) return;

      const uid = intent.contactUid;
      // If already selected, just clear intent
      if (selectedChat?.id === uid) {
        return;
      }

      // Find existing chat in list
      const existing = chats.find(c => c.id === uid || c.uid === uid);
      if (existing) {
        setSelectedChat(existing);
        onChatSelect(existing);
        return;
      }

      // Ensure chat exists in Firestore via handleNewChat
      await handleNewChat({ id: uid, name: intent.quote?.senderName || 'User' });

      // Immediately ensure local list includes this chat so desktop pane renders
      const minimal = {
        id: uid,
        uid,
        name: intent.quote?.senderName || 'User',
        profilePicture: '',
        isOnline: false,
        lastMessage: null,
        lastMessageAt: null,
        messages: [],
      };
      setChats((prev) => {
        const exists = prev.some(c => (c.id === uid || c.uid === uid));
        return exists ? prev : [minimal, ...prev];
      });
      setSelectedChat(minimal);
      onChatSelect(minimal);
      try { localStorage.removeItem('chat_dm_intent'); } catch (_) {}
    };

    if (currentUser && Array.isArray(chats)) {
      tryConsumeIntent();
    }
  }, [currentUser, chats, selectedChat, onChatSelect]);

  // Lock/Unlock folders with PIN flow like ChatList
  const lockFolders = async (foldersToLock) => {
    if (!currentUser?.uid || !foldersToLock?.length) return;
    // If no PIN set, prompt to set it first, then proceed
    if (!pinExists) {
      openSetPinModal(async () => {
        try {
          for (const f of foldersToLock) {
            await updateDoc(doc(db, 'userFolders', currentUser.uid, 'folders', f.id), {
              isLocked: true,
              lockedAt: serverTimestamp(),
            });
          }
          showToast('Folder(s) locked', 'success');
        } catch (e) {
          console.error('ChatMe: lockFolders error', e);
          showToast('Failed to lock folders', 'error');
        }
      });
      return;
    }
    // Confirm lock when PIN already exists
    openConfirmLockModal(async () => {
      try {
        for (const f of foldersToLock) {
          await updateDoc(doc(db, 'userFolders', currentUser.uid, 'folders', f.id), {
            isLocked: true,
            lockedAt: serverTimestamp(),
          });
        }
        showToast('Folder(s) locked', 'success');
      } catch (e) {
        console.error('ChatMe: lockFolders error', e);
        showToast('Failed to lock folders', 'error');
      }
    });
  };

  const unlockFolders = async (foldersToUnlock) => {
    if (!currentUser?.uid || !foldersToUnlock?.length) return;
    // Ask to unlock once, then apply to all
    openUnlockModal(async () => {
      try {
        for (const f of foldersToUnlock) {
          await updateDoc(doc(db, 'userFolders', currentUser.uid, 'folders', f.id), {
            isLocked: false,
          });
        }
        showToast('Folder(s) unlocked', 'success');
      } catch (e) {
        console.error('ChatMe: unlockFolders error', e);
        showToast('Failed to unlock folders', 'error');
      }
    });
  };

  const { openUnlockModal, openConfirmLockModal, openSetPinModal, showToast, pinExists } = useChatLock();

  const openFolder = (folder) => {
    if (folder?.isLocked) {
      openUnlockModal(() => {
        setSelectedFolder(folder);
        setActiveTab('folders');
      });
      return;
    }
    setSelectedFolder(folder);
    setActiveTab('folders');
  };

  const openAddChats = () => setShowAddToFolder(true);
  const closeAddChats = () => setShowAddToFolder(false);

  // Open folder picker from ChatList bulk selection
  const openFolderPickerForChats = (chatUids) => {
    setPendingSelectedChatUids(chatUids || []);
    setShowFolderPicker(true);
  };

  // Confirm adding selected chats to selected folders (max 3)
  const confirmAddToFolders = async (folderIds) => {
    try {
      const ids = Array.isArray(folderIds) ? folderIds.slice(0, 3) : [];
      if (!currentUser?.uid || ids.length === 0 || pendingSelectedChatUids.length === 0) return;
      let updatedAny = false;
      for (const fid of ids) {
        const ref = doc(db, 'userFolders', currentUser.uid, 'folders', fid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          console.warn('confirmAddToFolders: folder missing, skipping', fid);
          continue; // skip non-existent to avoid unnamed duplicates
        }
        await updateDoc(ref, { members: arrayUnion(...pendingSelectedChatUids) });
        updatedAny = true;
      }
      if (updatedAny) {
        // Optimistically reflect in local state
        setFolders((prev) => prev.map(f => ids.includes(f.id)
          ? { ...f, members: Array.from(new Set([...(f.members || []), ...pendingSelectedChatUids])) }
          : f
        ));
        showToast && showToast('Added chats to folder(s)', 'success');
      }
      setShowFolderPicker(false);
      setPendingSelectedChatUids([]);
    } catch (e) {
      console.error('ChatMe: confirmAddToFolders error', e);
      showToast && showToast('Failed to add to folders', 'error');
    }
  };

  const startCreateFolderFromPicker = () => {
    setPendingCreateAndAdd(true);
    setShowFolderPicker(false);
    setShowFolderCreate(true);
  };

  const addChatToFolder = async (uid) => {
    if (!currentUser?.uid || !selectedFolder) return;
    try {
      // Optimistic update so the modal list removes immediately
      setSelectedFolder((prev) => prev ? { ...prev, members: Array.from(new Set([...(prev.members || []), uid])) } : prev);
      setFolders((prev) => prev.map((f) => f.id === selectedFolder.id ? { ...f, members: Array.from(new Set([...(f.members || []), uid])) } : f));
      const ref = doc(db, 'userFolders', currentUser.uid, 'folders', selectedFolder.id);
      await updateDoc(ref, { members: arrayUnion(uid) });
    } catch (e) {
      console.error('ChatMe: addChatToFolder error', e);
    }
  };

  const removeChatFromFolder = async (uid) => {
    if (!currentUser?.uid || !selectedFolder) return;
    try {
      const ref = doc(db, 'userFolders', currentUser.uid, 'folders', selectedFolder.id);
      await updateDoc(ref, { members: arrayRemove(uid) });
    } catch (e) {
      console.error('ChatMe: removeChatFromFolder error', e);
    }
  };

  const removeChatsFromFolder = async (uids) => {
    if (!currentUser?.uid || !selectedFolder || !Array.isArray(uids) || uids.length === 0) return;
    try {
      // Optimistic update
      setSelectedFolder((prev) => prev ? { ...prev, members: (prev.members || []).filter((m) => !uids.includes(m)) } : prev);
      setFolders((prev) => prev.map((f) => f.id === selectedFolder.id ? { ...f, members: (f.members || []).filter((m) => !uids.includes(m)) } : f));
      const ref = doc(db, 'userFolders', currentUser.uid, 'folders', selectedFolder.id);
      await updateDoc(ref, { members: arrayRemove(...uids) });
    } catch (e) {
      console.error('ChatMe: removeChatsFromFolder error', e);
    }
  };

  const deleteCurrentFolder = async () => {
    if (!currentUser?.uid || (!selectedFolder && foldersToDelete.length === 0)) return;
    try {
      const targets = foldersToDelete.length > 0 ? foldersToDelete : [selectedFolder];
      for (const f of targets) {
        await deleteDoc(doc(db, 'userFolders', currentUser.uid, 'folders', f.id));
      }
      if (targets.find((f) => f.id === selectedFolder?.id)) {
        setSelectedFolder(null);
      }
      setFoldersToDelete([]);
      setShowFolderDeleteConfirm(false);
    } catch (e) {
      console.error('ChatMe: deleteCurrentFolder error', e);
    }
  };

  const renameCurrentFolder = async (newName) => {
    if (!currentUser?.uid || !selectedFolder || !newName) return;
    try {
      await updateDoc(doc(db, 'userFolders', currentUser.uid, 'folders', selectedFolder.id), { name: newName });
      setShowFolderRename(false);
    } catch (e) {
      console.error('ChatMe: renameCurrentFolder error', e);
    }
  };

  // Folder list action helpers
  const openFolderDeleteConfirm = (folderOrArray) => {
    if (Array.isArray(folderOrArray)) {
      setFoldersToDelete(folderOrArray);
    } else if (folderOrArray) {
      setFoldersToDelete([folderOrArray]);
      setSelectedFolder(folderOrArray);
    }
    setShowFolderDeleteConfirm(true);
  };
  const openFolderRename = (folder) => {
    setSelectedFolder(folder);
    setShowFolderRename(true);
  };

  // Toggle folder pin with persistence
  const toggleFolderPin = async (folder) => {
    if (!currentUser?.uid || !folder?.id) return;
    try {
      // Optimistic update
      setFolders((prev) => prev.map(f => f.id === folder.id ? { ...f, isPinned: !folder.isPinned } : f));
      await updateDoc(doc(db, 'userFolders', currentUser.uid, 'folders', folder.id), {
        isPinned: !folder.isPinned,
      });
    } catch (e) {
      console.error('ChatMe: toggleFolderPin error', e);
      // Revert optimistic if needed
      setFolders((prev) => prev.map(f => f.id === folder.id ? { ...f, isPinned: folder.isPinned } : f));
    }
  };

  // Global WebSocket connection for receiving typing/online status updates even when no chat is open
  const { sendJsonMessage: globalSendJsonMessage, lastJsonMessage: globalLastJsonMessage, readyState: globalReadyState } = useWebSocket(
    currentUser?.uid ? `ws://localhost:5000` : null,
    {
      onOpen: () => {
        // console.log(`🔌 Global WS connected for user: ${currentUser.uid}`);
      },
      onClose: () => {}, // console.log(`🔌 Global WS disconnected`)
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  // Join all chat rooms when chats are loaded and WebSocket is connected
  useEffect(() => {
    if (!currentUser?.uid || !globalSendJsonMessage || globalReadyState !== 1) return;
    if (chats.length === 0) return;

    // console.log(`🔌 Global WS: Joining ${chats.length} chat rooms for typing/online updates`);

    // Join each chat room to receive typing/online events
    chats.forEach(chat => {
      if (chat.chatId && chat.chatId !== yourselfChatId) {
        // console.log(`🔌 Joining chat room: ${chat.chatId} for user ${chat.uid}`);
        globalSendJsonMessage({
          type: "join",
          chatId: chat.chatId,
          userId: currentUser.uid
        });
      }
    });
  }, [currentUser?.uid, chats, globalSendJsonMessage, globalReadyState]);

  // Handle global WebSocket messages for typing and online status
  useEffect(() => {
    if (!globalLastJsonMessage) return;

    const { type, data } = globalLastJsonMessage;
    // console.log('ChatMe: Global WS message received:', { type, data });

    switch (type) {
      case "typing_start":
        // console.log(`⌨️ ChatMe Global WS: User ${data.userId} started typing`);
        setTypingUsers(prev => {
          const updated = { ...prev, [data.userId]: true };
          // console.log('ChatMe: Updated typingUsers (typing_start):', updated);
          return updated;
        });
        break;
      case "typing_stop":
        // console.log(`⏹️ ChatMe Global WS: User ${data.userId} stopped typing`);
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          // console.log('ChatMe: Updated typingUsers (typing_stop):', updated);
          return updated;
        });
        break;
      case "user_online":
        // console.log(`🟢 ChatMe Global WS: User ${data.userId} is online`);
        setOnlineUsers(prev => new Set([...prev, data.userId]));
        break;
      case "user_offline":
        // console.log(`🔴 ChatMe Global WS: User ${data.userId} is offline`);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        break;
      case "users_online":
        // console.log(`👥 ChatMe Global WS: ${data.length} users online`);
        setOnlineUsers(prev => new Set([...prev, ...data]));
        break;
      default:
        break;
    }
  }, [globalLastJsonMessage]);

  // Load user's folders
  useEffect(() => {
    if (!currentUser?.uid) {
      setFolders([]);
      setSelectedFolder(null);
      return;
    }
    const foldersCol = collection(db, 'userFolders', currentUser.uid, 'folders');
    const unsub = onSnapshot(foldersCol, (snap) => {
      const f = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFolders(f);
      if (selectedFolder) {
        const updated = f.find((x) => x.id === selectedFolder.id);
        if (updated) setSelectedFolder(updated);
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // FIXED: Clear typing when no chat selected (user not typing anymore)
  useEffect(() => {
    if (!selectedChat) {
      // Don't clear typingUsers - we want to see who's typing even when no chat is selected
      // setTypingUsers({});
      // Keep onlineUsers as global
    }
  }, [selectedChat]);

  // FIXED: Handle status updates from Chat (typing/online for list)
  const handleStatusUpdate = useCallback((userId, type, isActive) => {
    // console.log('ChatMe: handleStatusUpdate called:', { userId, type, isActive });
    if (type === 'typing') {
      setTypingUsers(prev => {
        const updated = { ...prev };
        if (isActive) {
          updated[userId] = true;
        } else {
          delete updated[userId]; // Remove when stopped typing
        }
        // console.log('ChatMe: Updated typingUsers:', updated);
        return updated;
      });
    } else if (type === 'online') {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isActive) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        // console.log('ChatMe: Updated onlineUsers:', Array.from(newSet));
        return newSet;
      });
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // console.log('ChatMe: Auth state changed, user:', {
        //   uid: firebaseUser.uid,
        //   isUidLowercase: firebaseUser.uid === firebaseUser.uid.toLowerCase(),
        // });
        setCurrentUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || user?.name || 'You',
          profilePicture: firebaseUser.photoURL || user?.avatar || 'https://ui-avatars.com/api/?name=You',
          email: firebaseUser.email || user?.email || 'user@example.com',
          phone: firebaseUser.phoneNumber || user?.phone || '',
          status: 'online',
          role: 'user',
        });
      } else {
        // console.log('ChatMe: No authenticated user');

        // Clear cache on logout
        if (currentUser?.uid) {
          ChatCache.clearUserCache(currentUser.uid);
          // console.log('🗑️ Cleared cache for logged out user');
        }

        setCurrentUser(null);
        setChats([]);
        setContacts([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch and listen to user chats
  useEffect(() => {
    if (!currentUser?.uid) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    // 1. Load from cache immediately for instant UI
    const cacheKey = ChatCache.KEYS.CHATLIST(currentUser.uid);
    const cachedChats = ChatCache.load(cacheKey, ChatCache.MAX_AGE.CHATLIST);

    const hasCache = Array.isArray(cachedChats) && cachedChats.length > 0;
    if (hasCache) {
      // console.log('📦 Loaded', cachedChats.length, 'chats from cache');
      setChats(cachedChats);
      setIsLoading(false);
    }

    // 2. Fetch from Firebase in background
    if (!hasCache) setIsLoading(true);
    const userChatsQuery = query(collection(db, 'userChats', currentUser.uid, 'chats'));
    const unsubscribe = onSnapshot(userChatsQuery, async (snapshot) => {
      try {
        // AUTO-CREATE SELF-CHAT: Ensure current user has a self-chat document in Firestore
        const allDocIds = snapshot.docs.map(doc => doc.id);
        if (!allDocIds.includes(currentUser.uid)) {
          // console.log('ChatMe: Creating self-chat document at /userChats/' + currentUser.uid + '/chats/' + currentUser.uid);
          try {
            await setDoc(doc(db, 'userChats', currentUser.uid, 'chats', currentUser.uid), {
              contactUid: currentUser.uid,
              addedAt: serverTimestamp(),
              isPinned: false,
              isArchived: false,
              isMuted: false,
              isLocked: false,
              isDeleted: false,
            });
            // console.log('ChatMe: Self-chat document created successfully');
          } catch (error) {
            console.error('ChatMe: Error creating self-chat document:', error);
          }
        }

        // Build unique contact IDs, excluding self to avoid duplicate "You" entries
        const contactUids = Array.from(new Set(
          snapshot.docs
            .filter((doc) => doc.id !== 'trigger' && !doc.data().isDeleted)
            .map((doc) => doc.id)
        ))
          .filter((id) => id !== currentUser.uid);
        // console.log('ChatMe: Contact UIDs from userChats:', contactUids);

        // Optimize: Batch fetch user profiles and latest messages in parallel to
        // reduce round-trips and speed up initial chatlist rendering.
        const chatsMap = new Map();

        // Build a map of chat meta (chatData) for quick lookup
        const chatMetaByUid = new Map();
        snapshot.docs.forEach((doc) => {
          if (doc.id === 'trigger' || doc.data().isDeleted) return;
          chatMetaByUid.set(doc.id, doc.data());
        });

        // 1) Batch fetch user documents using `in` queries (chunked to 10 per query)
        const userDocsMap = new Map();
        const chunkSize = 10; // Firestore 'in' supports up to 10 values
        for (let i = 0; i < contactUids.length; i += chunkSize) {
          const chunk = contactUids.slice(i, i + chunkSize);
          const q = query(collection(db, 'users'), where('uid', 'in', chunk));
          const snapUsers = await getDocs(q);
          snapUsers.docs.forEach((d) => {
            const data = d.data();
            userDocsMap.set(data.uid || d.id, data);
          });
        }

        // 2) Prepare list of chats to fetch latest message for (non-self)
        const chatsToFetch = contactUids
          .filter((uid) => uid !== currentUser.uid)
          .map((uid) => {
            const isCurrent = uid === currentUser.uid;
            const chatId = isCurrent ? yourselfChatId : [currentUser.uid, uid].sort().join('_');
            return { uid, isCurrent, chatId };
          });

        // Helper to fetch latest message for a batch of chats (limit concurrency)
        const fetchLatestMessagesInBatches = async (items, batchSize = 10) => {
          const results = new Map();
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const promises = batch.map(async (item) => {
              if (item.isCurrent || item.chatId === yourselfChatId) return { uid: item.uid, message: null };
              const messagesQuery = query(
                collection(db, 'chats', item.chatId, 'messages'),
                orderBy('timestamp', 'desc'),
                limit(1)
              );
              try {
                const messagesSnap = await getDocs(messagesQuery);
                const visibleDocs = messagesSnap.docs.filter(
                  (doc) => !(doc.data().deletedBy || []).includes(currentUser.uid)
                );
                if (visibleDocs.length > 0) {
                  return { uid: item.uid, message: visibleDocs[0].data() };
                }
                return { uid: item.uid, message: null };
              } catch (e) {
                console.error('ChatMe: Error fetching latest message for', item.uid, e);
                return { uid: item.uid, message: null };
              }
            });
            const settled = await Promise.all(promises);
            settled.forEach((r) => {
              results.set(r.uid, r.message);
            });
          }
          return results;
        };

        const latestMessagesMap = await fetchLatestMessagesInBatches(chatsToFetch, 12);

        // 3) Build chat entries using fetched user docs and latest messages
        contactUids.forEach((contactUid) => {
          const data = userDocsMap.get(contactUid) || {};
          const chatData = chatMetaByUid.get(contactUid) || {};
          const isCurrent = contactUid === currentUser.uid;
          const chatId = isCurrent ? yourselfChatId : [currentUser.uid, contactUid].sort().join('_');

          const lastMsg = latestMessagesMap.get(contactUid);
          const chatInfo = {
            id: contactUid,
            uid: contactUid,
            name: isCurrent ? `${data.name || 'Yourself'} (You)` : data.name || 'Unknown',
            profilePicture: data.photoURL || 'https://ui-avatars.com/api/?name=Unknown',
            photoURL: data.photoURL || 'https://ui-avatars.com/api/?name=Unknown',
            email: data.email || 'No email',
            lastMessage: isCurrent ? 'This is you 👀' : (lastMsg ? (lastMsg.text || (lastMsg.file ? 'File' : 'Media')) : (chatData.isLocked ? ' Locked Chat' : 'Say hi 👋')),
            time: FormatTime(chatData.addedAt?.toDate?.() || new Date()),
            lastMessageTimestamp: lastMsg ? (lastMsg.timestamp?.toDate?.() || new Date()) : (chatData.addedAt?.toDate?.() || new Date()),
            lastMessageStatus: lastMsg ? (lastMsg.status || 'sent') : 'sent',
            lastMessageSenderUid: lastMsg ? (lastMsg.sender || null) : null,
            unreadCount: 0,
            isOnline: onlineUsers.has(contactUid) || data.isOnline || false,
            lastSeen: data.lastLogin?.toDate?.() || new Date(),
            isMuted: chatData.isMuted || false,
            isPinned: chatData.isPinned || false,
            isArchived: chatData.isArchived || false,
            isLocked: chatData.isLocked || false,
            lastActivity: lastMsg ? (lastMsg.timestamp?.toDate?.() || new Date()) : (chatData.addedAt?.toDate?.() || new Date()),
            messages: [],
            isYourself: isCurrent,
            isCurrent,
            currentUserUid: currentUser.uid,
            chatId,
          };

          if (!chatsMap.has(contactUid)) {
            chatsMap.set(contactUid, chatInfo);
          }
        });

        // Add self-chat if not present
        if (!chatsMap.has(yourselfChatId)) {
          chatsMap.set(yourselfChatId, {
            id: yourselfChatId,
            uid: currentUser.uid,
            name: `${currentUser.name} (You)`,
            profilePicture: currentUser.profilePicture,
            photoURL: currentUser.profilePicture,
            email: currentUser.email,
            lastMessage: 'This is you 👀',
            time: FormatTime(new Date()),
            lastMessageTimestamp: new Date(),
            lastMessageStatus: 'read',
            lastMessageSenderUid: currentUser.uid,
            unreadCount: 0,
            isOnline: true,
            lastSeen: new Date(),
            isMuted: false,
            isPinned: false,
            isArchived: false,
            isLocked: false,
            lastActivity: new Date(),
            messages: [],
            isYourself: true,
            isCurrent: true,
            currentUserUid: currentUser.uid,
            chatId: yourselfChatId,
          });
        }

        // 3. Update state and cache
        const chatsData = Array.from(chatsMap.values());
        setChats(chatsData);
        ChatCache.save(cacheKey, chatsData, ChatCache.MAX_AGE.CHATLIST);
        // console.log('💾 Saved', chatsData.length, 'chats to cache');
        setIsLoading(false);

        // Set up message listeners for each chat
        const messageUnsubscribers = chatsData
          .filter((chat) => !chat.isYourself && chat.chatId !== yourselfChatId)
          .map((chat) => {
            const messagesQuery = query(
              collection(db, 'chats', chat.chatId, 'messages'),
              orderBy('timestamp', 'desc'),
              limit(1)
            );
            return onSnapshot(messagesQuery, (snap) => {
              const visibleDocs = snap.docs.filter(
                (doc) => !(doc.data().deletedBy || []).includes(currentUser.uid)
              );
              let lastMessage = chat.isLocked ? ' Locked Chat' : 'Say hi 👋';
              let lastMessageTimestamp = chat.lastActivity || new Date();
              let lastMessageStatus = 'sent';
              let lastMessageSenderUid = null;

              if (visibleDocs.length > 0 && !chat.isLocked) {
                const messageData = visibleDocs[0].data();
                lastMessage = messageData.text || (messageData.file ? 'File' : 'Media');
                lastMessageTimestamp = messageData.timestamp?.toDate?.() || new Date();
                lastMessageStatus = messageData.status || 'sent';
                lastMessageSenderUid = messageData.sender || null;
                // console.log('ChatMe: Message snapshot for', chat.uid, {
                //   lastMessage,
                //   lastMessageStatus,
                //   lastMessageSenderUid,
                //   timestamp: lastMessageTimestamp.toISOString(),
                // });
              }

              setChats((prevChats) => {
                const updatedChats = prevChats.map((c) =>
                  c.uid === chat.uid
                    ? {
                      ...c,
                      lastMessage,
                      lastMessageTimestamp,
                      lastMessageStatus,
                      lastMessageSenderUid,
                      lastActivity: lastMessageTimestamp,
                    }
                    : c
                ).sort((a, b) => {
                  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                  if (typingUsers[a.uid] !== typingUsers[b.uid]) return typingUsers[a.uid] ? -1 : 1;
                  if (onlineUsers.has(a.uid) !== onlineUsers.has(b.uid)) return onlineUsers.has(a.uid) ? -1 : 1;
                  return new Date(b.lastActivity) - new Date(a.lastActivity);
                });

                // Update cache when messages change
                ChatCache.save(cacheKey, updatedChats, ChatCache.MAX_AGE.CHATLIST);

                return updatedChats;
              });
            }, (error) => {
              console.error('ChatMe: Error in messages snapshot for', chat.uid, error);
            });
          });

        // Subscribe to disappearing settings per chat (for clock badge on list)
        const disappearingUnsubscribers = chatsData
          .filter((chat) => !chat.isYourself && chat.chatId !== yourselfChatId)
          .map((chat) => {
            const chatDocRef = doc(db, 'chats', chat.chatId);
            return onSnapshot(chatDocRef, (snap) => {
              const d = snap.data() || {};
              const daysRaw = d.disappearingDurationDays;
              const days = Number(daysRaw ?? 0);
              const safeDays = Number.isFinite(days) ? days : 0;
              setChats((prev) => prev.map((c) => (
                c.uid === chat.uid
                  ? { ...c, disappearingDays: safeDays, hasDisappearingActive: safeDays > 0 }
                  : c
              )));
            }, () => {
              // On error, default to off
              setChats((prev) => prev.map((c) => (
                c.uid === chat.uid
                  ? { ...c, hasDisappearingActive: false, disappearingDays: 0 }
                  : c
              )));
            });
          });

        // Set up unread message listeners
        const unreadUnsubscribers = chatsData
          .filter((chat) => !chat.isYourself && chat.chatId !== yourselfChatId)
          .map((chat) => {
            const unreadQuery = query(
              collection(db, 'chats', chat.chatId, 'messages'),
              where('receiver', '==', currentUser.uid),
              where('status', 'in', ['sent', 'delivered'])
            );
            return onSnapshot(unreadQuery, (snap) => {
              const unreadCount = snap.docs.filter(
                (doc) => !(doc.data().deletedBy || []).includes(currentUser.uid)
              ).length;
              setChats((prevChats) =>
                prevChats.map((c) =>
                  c.uid === chat.uid ? { ...c, unreadCount } : c
                )
              );
            }, (error) => {
              console.error('ChatMe: Error in unread snapshot for', chat.uid, error);
            });
          });

        return () => {
          messageUnsubscribers.forEach((unsub) => unsub());
          unreadUnsubscribers.forEach((unsub) => unsub());
          disappearingUnsubscribers.forEach((unsub) => unsub());
        };
      } catch (error) {
        console.error('ChatMe: Error fetching chats:', error);
        setChats([]);
        setIsLoading(false);
      }
    }, (error) => {
      console.error('ChatMe: Error in chats snapshot:', error);
      setChats([]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (!selectedChat || selectedChat.isYourself || !currentUser?.uid) return;

    const markMessagesAsRead = async () => {
      const chatId = selectedChat.chatId;
      if (!chatId) return;

      try {
        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          where('receiver', '==', currentUser.uid),
          where('status', 'in', ['sent', 'delivered'])
        );
        const messagesSnap = await getDocs(messagesQuery);
        const batch = writeBatch(db);

        messagesSnap.docs.forEach((doc) => {
          if (!(doc.data().deletedBy || []).includes(currentUser.uid)) {
            batch.update(doc.ref, { status: 'read' });
          }
        });

        await batch.commit();
        // console.log('ChatMe: Marked messages as read for', selectedChat.uid);
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.uid === selectedChat.uid ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (error) {
        console.error('ChatMe: Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [selectedChat, currentUser?.uid]);

  useEffect(() => {
    // console.log('ChatMe: viewingProfile changed, notifying parent. viewingProfile:', viewingProfile);
    onProfileViewerChange(!!viewingProfile);
  }, [viewingProfile, onProfileViewerChange]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedChat && !isMobileView) {
        setSelectedChat(null);
        onChatSelect(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedChat, isMobileView, onChatSelect]);

  const handleChatClick = (chat) => {
    const inFolderNow = activeTab === 'folders' && !!selectedFolder && (selectedFolder.members || []).includes(chat.uid);
    console.log('🔵 ChatMe: Chat clicked:', {
      chatName: chat.name,
      activeTab,
      selectedFolderName: selectedFolder?.name,
      inFolderNow,
      settingCameFromFolder: Boolean(inFolderNow)
    });
    setCameFromFolder(Boolean(inFolderNow));
    if (inFolderNow && selectedFolder?.id) {
      setFromFolderId(selectedFolder.id);
      // Keep a copy of the folder object so we can recover even if
      // `folders` hasn't updated or the live snapshot isn't available yet.
      setFromFolderSnapshot(selectedFolder);
      console.log('🔍 ChatMe: Snapshot folder for back navigation:', selectedFolder.id);
    }

    setSelectedChat(chat);
    onChatSelect(chat);
  };

  const handleBackToContacts = () => {
    console.log('🔙 ChatMe: handleBackToContacts FIRED! selectedFolder:', selectedFolder, 'fromFolderId:', fromFolderId, 'activeTab:', activeTab);
    const hasFolderContext = Boolean(cameFromFolder || fromFolderId || fromFolderSnapshot);
    const recoveredFolder = selectedFolder || fromFolderSnapshot || (fromFolderId ? folders.find(f => f.id === fromFolderId) : null);

    if (hasFolderContext && recoveredFolder) {
      // Always set the selectedFolder to the recovered folder so the UI has a concrete object
      // to render from (avoids relying on lookups from `folders` which may lag on mobile).
      setSelectedFolder(recoveredFolder);
      console.log('🔍 ChatMe: Recovered selectedFolder from snapshot (applied):', recoveredFolder.id);
      setActiveTab('folders');
    } else {
      setActiveTab('all');
    }

    // Clear chat AFTER tab/folder is set to avoid small-screen flicker to 'all'
    setSelectedChat(null);
    onChatSelect(null);

    // Clear the temporary snapshot/id AFTER a short delay to avoid racing with the
    // render caused by setSelectedChat(null) in mobile mode. This ensures the
    // folder view can read `selectedFolder` during the immediate render pass.
    setCameFromFolder(false);
    setTimeout(() => {
      setFromFolderId(null);
      setFromFolderSnapshot(null);
    }, 50);

    setTimeout(() => {
      console.log('🔙 Post-back:', { activeTab, hasSelectedFolder: !!selectedFolder });
    }, 0);
  };

  const handleArchive = async (chatId) => {
    try {
      const chatRef = doc(db, 'userChats', currentUser.uid, 'chats', chatId);
      await setDoc(chatRef, { isArchived: true }, { merge: true });
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        onChatSelect(null);
      }
    } catch (error) {
      console.error('ChatMe: Error archiving chat:', error);
    }
  };

  const handleUnarchive = async (chatId) => {
    try {
      const chatRef = doc(db, 'userChats', currentUser.uid, 'chats', chatId);
      await setDoc(chatRef, { isArchived: false }, { merge: true });
    } catch (error) {
      console.error('ChatMe: Error unarchiving chat:', error);
    }
  };

  const toggleMute = async (chatId) => {
    try {
      const chatRef = doc(db, 'userChats', currentUser.uid, 'chats', chatId);
      const chat = chats.find((c) => c.id === chatId);
      await setDoc(chatRef, { isMuted: !chat.isMuted }, { merge: true });
    } catch (error) {
      console.error('ChatMe: Error toggling mute:', error);
    }
  };

  const togglePin = async (chatIdOrUid) => {
    try {
      const chat = chats.find((c) => c.id === chatIdOrUid || c.uid === chatIdOrUid);
      if (!chat) {
        console.error('ChatMe: togglePin: chat not found for id/uid:', chatIdOrUid);
        return;
      }
      const docId = chat.id === yourselfChatId ? currentUser.uid : chat.id;
      const chatRef = doc(db, 'userChats', currentUser.uid, 'chats', docId);
      const nextPinned = !Boolean(chat.isPinned);

      // Optimistic update
      setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, isPinned: nextPinned } : c)));

      await setDoc(chatRef, { isPinned: nextPinned }, { merge: true });
    } catch (error) {
      console.error('ChatMe: Error toggling pin:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (chatId === yourselfChatId) {
      console.log('ChatMe: Cannot delete "Me" chat');
      return;
    }
    try {
      // console.log('ChatMe: Deleting chat:', { chatId, currentUserUid: currentUser.uid });
      const batch = writeBatch(db);
      const chatIdFirestore = [currentUser.uid, chatId].sort().join('_');

      // Mark messages as deleted
      const messagesRef = collection(db, 'chats', chatIdFirestore, 'messages');
      const snapshot = await getDocs(messagesRef);
      if (!snapshot.empty) {
        // console.log('ChatMe: Updating messages with deletedBy', { chatId: chatIdFirestore, messageCount: snapshot.docs.length });
        snapshot.docs.forEach((d) => {
          batch.update(d.ref, {
            deletedBy: [...(d.data().deletedBy || []), currentUser.uid],
          });
        });
      } else {
        // console.log('ChatMe: No messages found for chat', { chatId: chatIdFirestore });
      }

      // Delete the chat document
      const chatDocRef = doc(db, 'userChats', currentUser.uid, 'chats', chatId);
      // console.log('ChatMe: Deleting chat document:', chatDocRef.path);
      batch.delete(chatDocRef);

      // Commit batch
      await batch.commit();
      // console.log('ChatMe: Batch deletion committed successfully');

      // Update local state
      setChats((prevChats) => {
        const updatedChats = prevChats.filter((c) => c.id !== chatId);
        // console.log('ChatMe: Updated local chats state:', updatedChats.map((c) => c.id));
        return updatedChats;
      });

      // Trigger snapshot update
      await setDoc(doc(db, 'userChats', currentUser.uid, 'trigger'), { updated: new Date() });

      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        onChatSelect(null);
      }
      // console.log('ChatMe: Chat deleted successfully:', chatId);
    } catch (error) {
      console.error('ChatMe: Error deleting chat:', error);
    }
  };

  const openProfileViewer = (chat) => {
    if (!chat) {
      console.error('ChatMe: Cannot open profile: chat is null/undefined');
      return;
    }
    const safeMessages = Array.isArray(chat.messages) ? chat.messages : [];
    const safeMedia = safeMessages
      .filter((msg) => msg && msg.media)
      .map((msg, index) => ({
        id: `media-${index}`,
        url: msg.media.url,
        type: msg.media.type,
        caption: msg.text || '',
        createdAt: msg.timestamp,
        likes: 0,
        comments: [],
        commentCount: 0,
        views: 0,
      }));

    const profile = {
      id: chat.id,
      name: chat.name,
      profilePicture: chat.profilePicture,
      currentUserUid: currentUser?.uid,
      isCurrent: !!chat.isYourself,
      isOnline: chat.isOnline || false,
      isFollowed: false,
      isMuted: chat.isMuted || false,
      isBlocked: false,
      bio: chat.id === yourselfChatId ? (user?.bio || 'No bio available') : 'No bio available',
      email: chat.email || '',
      phone: chat.phone || '',
      links: chat.id === yourselfChatId ?
        (Object.entries(user?.socialMedia || {})
          .filter(([_, url]) => url)
          .map(([platform, url]) => ({ title: platform, url })) || []) : [],
      media: safeMedia,
      following: [],
      comments: [],
      followers: [],
      lastSeen: chat.lastSeen,
    };

    console.log('ChatMe: Profile object created:', profile);
    setViewingProfile(profile);
  };

  const closeProfileViewer = () => {
    console.log('ChatMe: Closing ProfileViewer');
    setViewingProfile(null);
  };

  const handleMessageCreated = async (newMessage, chatId) => {
    const now = new Date();
    const messageWithTime = {
      ...newMessage,
      id: `${chatId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      time: FormatMessageTime(now),
      status: 'delivered', // Start with delivered (backend will update)
    };

    console.log('ChatMe: Message created - immediate update', {
      chatId,
      text: newMessage.text?.substring(0, 30),
      status: 'delivered',
      sender: currentUser.uid
    });

    setChats((prevChats) => {
      const updated = prevChats.map((chat) => {
        if (chat.id === chatId || chat.uid === chatId) {
          return {
            ...chat,
            lastMessage: newMessage.text || 'Attachment',
            time: FormatTime(now),
            lastMessageTimestamp: now,
            lastMessageStatus: 'delivered',
            lastMessageSenderUid: currentUser.uid,
            messages: [...chat.messages, messageWithTime],
            lastActivity: now,
            isTyping: false, // Clear typing when message sent
          };
        }
        return chat;
      });

      // Instant sort
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.isTyping !== b.isTyping) return a.isTyping ? -1 : 1;
        if (onlineUsers.has(a.uid) !== onlineUsers.has(b.uid)) return onlineUsers.has(a.uid) ? -1 : 1;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      });
    });
  };

  const handleNewChat = async (contact) => {
    if (!contact.id || !contact.name) {
      console.error('ChatMe: Invalid contact data:', contact);
      return;
    }
    if (contact.id === yourselfChatId) {
      console.log('ChatMe: Selecting existing "Me" chat');
      handleChatClick(chats.find((c) => c.id === yourselfChatId));
      return;
    }
    const existingChat = chats.find((c) => c.id === contact.id);
    if (existingChat) {
      console.log('ChatMe: Existing chat found, selecting:', existingChat);
      handleChatClick(existingChat);
      return;
    }
    try {
      const chatRef = doc(db, 'userChats', currentUser.uid, 'chats', contact.id);
      await setDoc(chatRef, {
        contactUid: contact.id,
        addedAt: serverTimestamp(),
        isPinned: false,
        isArchived: false,
        isMuted: false,
        isLocked: false,
        isDeleted: false,
      });
      console.log('ChatMe: Added new chat to Firestore:', contact);
    } catch (error) {
      console.error('ChatMe: Error adding new chat:', error);
    }
  };

  const handleNewContact = async (contact) => {
    const normalized = {
      id: contact.id || Date.now().toString(),
      name: contact.name || 'Unknown',
      phone: contact.phone || '',
      email: contact.email || '',
      isManual: contact.isManual || false,
    };
    try {
      const userRef = doc(db, 'users', normalized.id);
      await setDoc(userRef, {
        uid: normalized.id,
        name: normalized.name,
        phone: normalized.phone,
        email: normalized.email,
        isManual: normalized.isManual,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalized.name)}`,
        lastLogin: serverTimestamp(),
      }, { merge: true });
      console.log('ChatMe: Added new contact to Firestore:', normalized);
      handleNewChat(normalized);
    } catch (error) {
      console.error('ChatMe: Error adding new contact:', error);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (contactId === yourselfChatId) {
      console.log('ChatMe: Cannot delete "Me" contact');
      return;
    }
    await handleDeleteChat(contactId);
  };

  const handleCreateGroup = () => {
    console.log('ChatMe: Opening group creation modal');
    setShowGroupCreation(true);
  };

  const handleGroupCreated = (group) => {
    console.log('ChatMe: Group created:', group);
    setShowGroupCreation(false);
    // Optionally navigate to the new group or show success message
    // For now, just close the modal
  };

  // FCM: subscribe current device to the group's topic when group is created
  const { token: fcmToken } = useFCMToken();
  const handleGroupCreatedAndSubscribe = async (group) => {
    try {
      await handleGroupCreated(group);
      if (group?.id && fcmToken) {
        const res = await subscribeToGroupTopic(group.id, fcmToken);
        if (!res.ok) console.warn('FCM topic subscribe failed:', res.error);
      }
    } catch (e) {
      console.warn('handleGroupCreatedAndSubscribe error', e);
    }
  };

  return (
      <div className={`chatme-main-container ${isMobileView ? 'mobile-view' : 'desktop-view'}`}>
        {!isMobileView || !selectedChat ? (
          <div className="chatme-chat-list" style={{ position: 'relative' }}>
            {activeTab === 'all' ? (
              <ChatList
                chats={chats.filter((c) => !allFolderMembers.has(c.uid))}
                searchQuery={localSearchQuery}
                setSearchQuery={setLocalSearchQuery}
                showArchived={showArchived}
                setShowArchived={setShowArchived}
                onChatClick={handleChatClick}
                onAvatarClick={openProfileViewer}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onToggleMute={toggleMute}
                onTogglePin={togglePin}
                onDelete={handleDeleteChat}
                selectedChat={selectedChat}
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                isLoading={isLoading}
                onShowFolders={() => setActiveTab('folders')}
                hasFolders={folders.length > 0}
                hasArchivedChats={chats.some(c => c.isArchived)}
                onShowAll={() => setActiveTab('all')}
                activeTab={activeTab}
                onAddToFolders={openFolderPickerForChats}
              />
            ) : (selectedFolder || fromFolderId) ? (
              <>
                <div className="chatme-header">
                  <div className="chatme-header-top" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="chatme-all-btn"
                      onClick={() => { setSelectedFolder(null); setFromFolderId(null); }}
                      title="Back"
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}
                    >
                      <FiArrowLeft />
                    </button>
                    <h2 style={{ margin: 0, flexShrink: 0 }}>
                      {(selectedFolder?.name) || (folders.find(f => f.id === fromFolderId)?.name) || ''}
                    </h2>
                    <input
                      type="text"
                      placeholder={`Search ${(selectedFolder?.name) || (folders.find(f => f.id === fromFolderId)?.name) || 'folder'} ...`}
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="chatme-search-input"
                      style={{ flex: 1, minWidth: 150 }}
                    />
                  </div>
                </div>
                <FolderDetail
                  folder={selectedFolder || folders.find(f => f.id === fromFolderId)}
                  chatsMap={folderChatsMap}
                  onChatClick={handleChatClick}
                  onAddChats={openAddChats}
                  onRemoveMembers={removeChatsFromFolder}
                  typingUsers={typingUsers}
                  onlineUsers={onlineUsers}
                  searchQuery={localSearchQuery}
                />
                <button
                  className="chatme-fab -fab"
                  onClick={openAddChats}
                  title="Add chats to folder"
                >
                  +
                </button>
              </>
            ) : (
              <>
                <div className="chatme-header">
                  <div className="chatme-header-top">
                    <h2>Vibes</h2>
                    <input
                      type="text"
                      placeholder="Search folders ..."
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="chatme-search-input"
                    />
                  </div>
                  <div className="chatme-header-buttons">
                    <button
                      className="chatme-all-btn"
                      onClick={() => { setShowArchived(false); setActiveTab('all'); }}
                      style={{
                        borderBottom: (activeTab === 'all' && !showArchived) ? '2px solid var(--accent, #00a884)' : '2px solid transparent',
                        fontWeight: (activeTab === 'all' && !showArchived) ? 600 : 500,
                        color: (activeTab === 'all' && !showArchived) ? 'var(--accent, #00a884)' : '#ffffff',
                      }}
                    >
                      All
                    </button>
                    <button
                      className="chatme-archive-btn"
                      onClick={() => setActiveTab('folders')}
                      title="Folders"
                      style={{
                        borderBottom: (activeTab === 'folders') ? '2px solid var(--accent, #00a884)' : '2px solid transparent',
                        fontWeight: (activeTab === 'folders') ? 600 : 500,
                        color: (activeTab === 'folders') ? 'var(--accent, #00a884)' : '#ffffff',
                      }}
                    >
                      Folders
                    </button>
                    {chats.some(c => c.isArchived) && (
                      <button
                        className="chatme-archive-btn"
                        onClick={() => { setShowArchived(!showArchived); setActiveTab('all'); }}
                        style={{
                          borderBottom: (showArchived && activeTab === 'all') ? '2px solid var(--accent, #00a884)' : '2px solid transparent',
                          fontWeight: (showArchived && activeTab === 'all') ? 600 : 500,
                          color: (showArchived && activeTab === 'all') ? 'var(--accent, #00a884)' : '#ffffff',
                        }}
                      >
                        Archived
                      </button>
                    )}
                  </div>
                </div>
                <FolderList
                  folders={folders}
                  onOpen={openFolder}
                  onRename={openFolderRename}
                  onDelete={openFolderDeleteConfirm}
                  chatsMap={folderChatsMap}
                  searchQuery={localSearchQuery}
                  onTogglePinFolder={toggleFolderPin}
                  onLockFolders={(arr) => lockFolders(arr)}
                  onUnlockFolders={(arr) => unlockFolders(arr)}
                />
              </>
            )}
          </div>
        ) : null}

        {(!isMobileView || selectedChat) && (
          <div className={`chatme-chat-window ${isMobileView ? 'full-width' : 'side-by-side'}`}>
            {selectedChat ? (
              <Chat
                initialMessages={selectedChat.messages}
                currentUser={currentUser}
                contact={{
                  id: selectedChat.id,
                  name: selectedChat.name,
                  avatar: selectedChat.profilePicture,
                  status: selectedChat.isOnline && !selectedChat.isYourself ? 'online' : 'offline',
                  lastSeen: selectedChat.lastSeen,
                }}
                onMessageCreated={(msg) => handleMessageCreated(msg, selectedChat.id)}
                isMobileView={isMobileView}
                onBackClick={handleBackToContacts}
                onStatusUpdate={handleStatusUpdate}  // NEW: Pass callback to update list
              />
            ) : (
              <EmptyChatView />
            )}
          </div>
        )}

        {(!selectedChat || !isMobileView) && currentUser && !selectedFolder && (
          <FloatingActionButton
            className="chatme-fab"
            contacts={contacts}
            onNewChat={handleNewChat}
            onNewContact={handleNewContact}
            onDeleteContact={handleDeleteContact}
            onCreateGroup={handleCreateGroup}
            onCreateFolder={handleCreateFolder}
            isChatSelected={!!selectedChat}
            currentUser={currentUser}
          />
        )}
        {viewingProfile && (
          <ProfileViewer
            profile={viewingProfile}
            onClose={closeProfileViewer}
            onToggleMute={() => toggleMute(viewingProfile.id)}
            onToggleBlock={() => console.log('Toggle block:', viewingProfile.id)}
            onToggleFollow={() => console.log('Toggle follow:', viewingProfile.id)}
            onReport={() => console.log('Report:', viewingProfile.id)}
          />
        )}



        {showGroupCreation && (
          <GroupCreation
            onClose={() => setShowGroupCreation(false)}
            onGroupCreated={handleGroupCreatedAndSubscribe}
          />
        )}
        <FolderPickerModal
          show={showFolderPicker}
          folders={folders}
          onClose={() => { setShowFolderPicker(false); setPendingSelectedChatUids([]); }}
          onConfirm={confirmAddToFolders}
          onCreateNew={startCreateFolderFromPicker}
        />
        <FolderCreateModal
          show={showFolderCreate}
          onClose={() => setShowFolderCreate(false)}
          onCreate={createFolder}
        />
        <AddToFolderModal
          show={showAddToFolder}
          onClose={closeAddChats}
          chats={chats.filter((c) => !c.isArchived && (!selectedFolder || !(selectedFolder.members || []).includes(c.uid)))}
          excludedUids={(selectedFolder?.members) || []}
          onAdd={addChatToFolder}
          folderName={selectedFolder?.name}
        />
        <FolderRenameModal
          show={showFolderRename}
          onClose={() => setShowFolderRename(false)}
          onRename={renameCurrentFolder}
          initialName={selectedFolder?.name}
        />
        {showFolderDeleteConfirm && (
          <div className="confirm-modal-overlay" onClick={() => setShowFolderDeleteConfirm(false)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <p>
                {foldersToDelete.length > 1
                  ? `Delete ${foldersToDelete.length} folders?`
                  : `Delete folder "${foldersToDelete[0]?.name || selectedFolder?.name}"?`}
              </p>
              <div className="confirm-buttons">
                <button onClick={() => setShowFolderDeleteConfirm(false)}>Cancel</button>
                <button className="delete-btn" onClick={deleteCurrentFolder}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};