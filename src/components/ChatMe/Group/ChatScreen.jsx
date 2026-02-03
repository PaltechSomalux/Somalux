import React, { useState, useRef, useEffect } from 'react';
import { FiLock } from 'react-icons/fi';
import { SearchBar } from './SearchBar';
import { GroupHeader } from "./GroupHeader";
import { MessageContainer } from "./MessageContainer";
import { ProfileViewer } from '../ChatList/Components/ProfileViewer';
import { InputArea } from './InputArea';
import { ForwardModal } from './ForwardModal';
import { GroupInfoModal } from './GroupInfoModal';
import { PollDisplay } from './PollDisplay';
import { useGroupChatState } from './useGroupChatState';
import { supabase, groupService } from '../../../supabase';
import "./ChatScreen.css";

export const ChatScreen = ({
  group: initialGroup,
  startCall,
  setShowContactPicker,
  setForwardMessage,
  setShowForwardMenu,
  onBackClick = () => { },
}) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Live group state (updated in real-time)
  const [group, setGroup] = useState(initialGroup);

  // Real-time group document listener
  useEffect(() => {
    if (!initialGroup?.id) return;

    const unsubscribe = groupService.subscribeToGroup(initialGroup.id, (payload) => {
      if (payload.new) {
        const updatedGroup = payload.new;
        // Calculate member count from members array
        const byMembers = Array.isArray(updatedGroup.member_ids) ? updatedGroup.member_ids.length : 0;
        updatedGroup.memberCount = byMembers || 0;
        setGroup(updatedGroup);
      }
    });

    return () => unsubscribe();
  }, [initialGroup?.id]);

  // useGroupChatState hook for messages & typing
  const {
    messages,
    newMessage: hookNewMessage,
    setNewMessage: setHookNewMessage,
    typingUsers,
    replyingTo: hookReplyingTo,
    setReplyingTo: setHookReplyingTo,
    sendMessage: hookSendMessage,
    sendPoll: hookSendPoll,
    votePoll: hookVotePoll,
    handleTyping: hookHandleTyping,
    markRead,
    reactToMessage,
    editMessageLocal,
    deleteForMeLocal,
    deleteForEveryoneLocal,
  } = useGroupChatState({
    groupId: group?.id,
    currentUser: currentUser ? {
      id: currentUser.id,
      name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'
    } : null,
    initialMessages: [],
    groupMemberCount: group?.memberCount || 0,
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [messageEdit, setMessageEdit] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [deletedForMeIds, setDeletedForMeIds] = useState(new Set());
  const [deletedForEveryoneIds, setDeletedForEveryoneIds] = useState(new Set());
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [voiceNoteRecording, setVoiceNoteRecording] = useState(false);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState(0);
  const [voiceNoteTimer, setVoiceNoteTimer] = useState(null);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState(null);
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [showProfileViewer, setShowProfileViewer] = useState(false);
  const [profileToView, setProfileToView] = useState(null);
  const [starredMessages, setStarredMessages] = useState([]);
  const [messageSelectionMode, setMessageSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messageInfoDetails, setMessageInfoDetails] = useState(null);
  const [playingVoiceNote, setPlayingVoiceNote] = useState(null);
  const [showVoiceNotePlayer, setShowVoiceNotePlayer] = useState(false);
  const [showForwardModalLocal, setShowForwardModalLocal] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const inputRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Deep-link handling state (must be declared before effects that reference it)
  const [deeplinkData, setDeeplinkData] = useState(null);
  const deeplinkAttemptsRef = useRef(0);
  const MAX_DEEPLINK_ATTEMPTS = 12; // ~6 seconds total if 500ms between attempts
  const highlightElRef = useRef(null);
  const highlightTargetIdRef = useRef(null);

  const newMessage = hookNewMessage;
  const setNewMessage = setHookNewMessage;
  const replyTo = hookReplyingTo;
  const setReplyTo = setHookReplyingTo;

  // Typing users for current group
  const currentGroupTypingUsers = typingUsers[group?.id] || {};
  const typingNames = Object.values(currentGroupTypingUsers).filter(Boolean);
  const isTyping = typingNames.length > 0;
  const isAdmin = !!(currentUser && group && (group.created_by === currentUser.id || (group.member_ids || []).includes(currentUser.id)));
  const adminOnly = !!group?.only_admins_can_send;

  // Update pinned & starred messages
  useEffect(() => {
    setPinnedMessages(messages.filter(m => m.pinned));
    setStarredMessages(messages.filter(m => m.starred));
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      const unreadMessages = messages.filter(
        msg => msg.sender_id !== currentUser.id && !(msg.read_by || []).includes(currentUser.id)
      );
      if (unreadMessages.length > 0) {
        markRead(unreadMessages.map(m => m.id));
      }
    }
  }, [messages, currentUser, markRead]);

  // Update read marker in group_message_reads table
  useEffect(() => {
    const userId = currentUser?.id;
    const gid = group?.id;
    if (!userId || !gid) return;

    const timeoutId = setTimeout(async () => {
      try {
        // Mark all messages as read for this user
        const { data: latestMessages } = await supabase
          .from('group_messages')
          .select('id')
          .eq('group_id', gid)
          .order('created_at', { ascending: false })
          .limit(messages.length);

        if (latestMessages && latestMessages.length > 0) {
          for (const msg of latestMessages) {
            await groupService.markMessageAsRead(msg.id, userId);
          }
        }
      } catch (e) {
        if (!e.message?.includes('permission')) {
          console.error('Failed to update read marker:', e);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, group?.id, messages.length]);

  // Scroll to bottom (unless a deep-link jump is active or temporarily suppressed)
  const [suppressAutoScroll, setSuppressAutoScroll] = useState(false);
  useEffect(() => {
    if (suppressAutoScroll) return;
    if (deeplinkData && deeplinkData.groupId === group?.id) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, replyTo, suppressAutoScroll, deeplinkData, group?.id]);

  // When auto-scroll is suppressed (due to deeplink), re-enable only on user interaction
  useEffect(() => {
    if (!suppressAutoScroll) return;
    const onRelease = () => {
      // Remove highlight when user starts interacting
      if (highlightElRef.current) {
        try {
          highlightElRef.current.classList.remove('pinned-highlight');
          // Clean inline persistent highlight styles
          highlightElRef.current.style.backgroundColor = '';
          highlightElRef.current.style.transition = '';
        } catch {}
        highlightElRef.current = null;
      }
      highlightTargetIdRef.current = null;
      setSuppressAutoScroll(false);
    };
    const onWheel = () => onRelease();
    const onTouchStart = () => onRelease();
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, [suppressAutoScroll]);

  // While suppressed, continuously ensure the target stays highlighted across re-renders
  useEffect(() => {
    if (!suppressAutoScroll) return;
    const interval = setInterval(() => {
      const id = highlightTargetIdRef.current;
      if (!id) return;
      let el = highlightElRef.current;
      if (!el) {
        el = document.getElementById(`message-${id}`);
        if (el) highlightElRef.current = el;
      }
      if (el && !el.classList.contains('pinned-highlight')) {
        try { el.classList.add('pinned-highlight'); } catch {}
      }
    }, 250);
    return () => clearInterval(interval);
  }, [suppressAutoScroll]);

  // Voice note timer
  useEffect(() => {
    if (voiceNoteRecording) {
      const timer = setInterval(() => {
        setVoiceNoteDuration(prev => prev + 1);
      }, 1000);
      setVoiceNoteTimer(timer);
    } else {
      if (voiceNoteTimer) clearInterval(voiceNoteTimer);
    }
    return () => voiceNoteTimer && clearInterval(voiceNoteTimer);
  }, [voiceNoteRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (adminOnly && !isAdmin) {
      return;
    }
    if (messageEdit) {
      saveEditedMessage();
      return;
    }
    if (newMessage.trim()) {
      hookSendMessage(newMessage);
      setReplyTo(null);
    } else if (recordedVoiceNote) {
      console.log('Voice notes not implemented');
      setRecordedVoiceNote(null);
      setVoiceNoteDuration(0);
    }
  };

  const toggleVoiceNoteRecording = () => {
    if (voiceNoteRecording) {
      setVoiceNoteRecording(false);
      setRecordedVoiceNote('recorded-voice-note.mp3');
    } else {
      setVoiceNoteRecording(true);
      setVoiceNoteDuration(0);
    }
  };

  const handlePinClick = (pin, navigate = false) => {
    if (navigate) {
      const element = document.getElementById(`message-${pin.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('pinned-highlight');
        setTimeout(() => element.classList.remove('pinned-highlight'), 2000);
      }
    } else {
      togglePinMessage(pin);
    }
  };

  const handleMessageOptions = (messageId, e) => {
    e.stopPropagation();
    setShowMessageOptions(showMessageOptions === messageId ? null : messageId);
  };

  const toggleMessageSelectionMode = () => {
    setMessageSelectionMode(!messageSelectionMode);
    if (messageSelectionMode) setSelectedMessages([]);
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const deleteSelectedMessages = async () => {
    if (!currentUser || !group?.id || selectedMessages.length === 0) return;
    try {
      // Delete each message for current user
      for (const messageId of selectedMessages) {
        await groupService.deleteMessage(messageId, currentUser.id);
      }
      setDeletedForMeIds(prev => new Set([...prev, ...selectedMessages]));
    } catch (e) {
      console.error('Batch delete failed:', e);
      alert('Failed to delete messages.');
    }
    setSelectedMessages([]);
    setMessageSelectionMode(false);
  };

  const forwardSelectedMessages = () => {
    const msgs = messages.filter(m => selectedMessages.includes(m.id));
    if (msgs.length > 0) {
      setMessagesToForward(msgs);
      setShowForwardModalLocal(true);
      setSelectedMessages([]);
      setMessageSelectionMode(false);
    }
  };

  const handleOpenProfile = (senderId, senderName) => {
    if (!senderId) return;
    // Try to find member in current group
    const member = group?.members?.find(m => m.uid === senderId || m.id === senderId);
    const profile = member ? {
      id: member.uid || member.id,
      name: member.name || member.displayName || senderName || 'User',
      profilePicture: member.photoURL || member.profilePicture || member.avatar,
      phone: member.phone || '',
      links: member.links || [],
      media: member.media || [],
      followers: member.followers || [],
      following: member.following || [],
      // mark as current only if this member is the logged-in user
      isCurrent: currentUser && (member.uid === currentUser.id || member.id === currentUser.id),
    } : {
      id: senderId,
      name: senderName || 'User',
      profilePicture: null,
      isCurrent: currentUser && (senderId === currentUser.id),
    };

    setProfileToView(profile);
    setShowProfileViewer(true);
  };

  const showMessageInfo = (message) => {
    const readByUsers = message.readBy
      ? group?.members?.filter(m => message.readBy.includes(m.id)).map(m => m.name) || []
      : [];
    setMessageInfoDetails({
      ...message,
      readBy: readByUsers,
      deliveredTo: group?.members?.map(m => m.name) || []
    });
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setShowMessageOptions(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleForward = (message) => {
    setMessagesToForward([message]);
    setShowForwardModalLocal(true);
    setShowMessageOptions(null);
  };

  // Start a DM from a group message
  const handleDirectMessage = async (message) => {
    try {
      if (!currentUser || !message?.sender_id || message.sender_id === currentUser.id) return;

      // Store DM intent with quote details for the DM window to consume
      const intent = {
        contactId: message.sender_id,
        quote: {
          id: message.id,
          text: message.text || '',
          senderName: message.sender_name || '',
          groupId: group?.id,
          groupName: group?.name,
          messageId: message.id,
          timestamp: message.created_at || Date.now(),
        },
        createdAt: Date.now(),
      };
      try {
        localStorage.setItem('chat_dm_intent', JSON.stringify(intent));
      } catch (e) {
        // ignore storage errors
      }

      // Navigate to chats view and open chat there (ChatMe will pick up the intent)
      try {
        window.location.assign('/ConnectMe#chat');
      } catch (_) {
        window.location.hash = '#chat';
      }
    } catch (e) {
      console.error('handleDirectMessage failed', e);
      alert('Failed to start DM');
    }
  };

  const handleForwardToGroups = async (messages, targetGroupIds) => {
    if (!currentUser || !messages.length || !targetGroupIds.length) return;
    try {
      for (const targetId of targetGroupIds) {
        for (const msg of messages) {
          await groupService.sendMessage(targetId, currentUser.id, msg.text || '', null, {
            forwarded: true,
            originalSender: msg.sender_name,
            mediaUrls: msg.media_urls,
          });
        }
      }
      setShowForwardModalLocal(false);
      setMessagesToForward([]);
    } catch (error) {
      console.error('Forward failed:', error);
      alert('Failed to forward.');
    }
  };

  const handleEditMessage = (message) => {
    setMessageEdit(message);
    setEditMessageText(message.text || '');
    setNewMessage(message.text || '');
    setShowMessageOptions(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveEditedMessage = async () => {
    if (!messageEdit || !currentUser || !group?.id) return;
    const text = newMessage.trim();
    if (!text) return;
    try {
      editMessageLocal(messageEdit.id, text);
      await groupService.updateMessage(messageEdit.id, { text, edited: true });
    } catch (e) {
      console.error('Edit failed:', e);
      alert('Failed to save edit.');
    } finally {
      setMessageEdit(null);
      setEditMessageText('');
      setNewMessage('');
    }
  };

  const deleteMessageForMe = async (messageId) => {
    if (!currentUser || !group?.id) return;
    try {
      deleteForMeLocal([messageId], currentUser.id);
      await groupService.deleteMessage(messageId, currentUser.id);
      setDeletedForMeIds(prev => new Set([...prev, messageId]));
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete.');
    }
    setShowDeleteConfirmation(null);
    setShowMessageOptions(null);
  };

  const deleteMessageForEveryone = async (messageId) => {
    if (!currentUser || !group?.id) return;
    const msg = messages.find(m => m.id === messageId);
    const isAdmin = group.created_by === currentUser.id || (group.member_ids || []).includes(currentUser.id);
    const isSender = msg?.sender_id === currentUser.id;
    if (!isAdmin && !isSender) {
      alert('Only admins or sender can delete for everyone.');
      return;
    }
    try {
      await groupService.deleteMessage(messageId, currentUser.id, true);
      deleteForEveryoneLocal([messageId]);
      setDeletedForEveryoneIds(prev => new Set([...prev, messageId]));
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete.');
    }
    setShowDeleteConfirmation(null);
    setShowMessageOptions(null);
  };

  const addReaction = async (messageId, emoji) => {
    if (!currentUser || !group?.id) return;
    try {
      reactToMessage(messageId, currentUser.id, emoji);
      await groupService.updateMessage(messageId, { 
        reactions: { [currentUser.id]: emoji }
      });
    } catch (e) {
      console.error('Reaction failed:', e);
    }
  };

  const clearChatForMe = async () => {
    if (!currentUser || !group?.id) return;
    try {
      const ids = messages
        .filter(m => !(m.deleted_by || []).includes(currentUser.id))
        .map(m => m.id);
      deleteForMeLocal(ids, currentUser.id);
      // Mark all messages as deleted for current user
      for (const id of ids) {
        await groupService.deleteMessage(id, currentUser.id);
      }
      setDeletedForMeIds(prev => new Set([...prev, ...ids]));
    } catch (e) {
      console.error('Clear chat failed:', e);
      alert('Failed to clear chat.');
    }
  };

  const togglePinMessage = async (messageOrId) => {
    if (!currentUser || !group?.id) return;
    const msg = typeof messageOrId === 'string'
      ? messages.find(m => m.id === messageOrId)
      : messageOrId;
    if (!msg?.id) return;

    const isAdmin = group.created_by === currentUser.id || group.member_ids?.includes(currentUser.id);
    if (!isAdmin) {
      alert('Only admins can pin messages');
      return;
    }

    const isPinned = Boolean(msg.is_pinned);
    if (!isPinned && pinnedMessages.length >= 3) {
      alert('Max 3 pinned messages. Unpin one first.');
      return;
    }

    try {
      await groupService.updateMessage(msg.id, {
        is_pinned: !isPinned
      });
      setPinnedMessages(prev =>
        isPinned ? prev.filter(m => m.id !== msg.id) : [...prev, { ...msg, is_pinned: true }]
      );
    } catch (error) {
      console.error('Pin failed:', error);
      alert('Failed to pin.');
    }
  };

  const baseFiltered = messages
    .filter(msg => !(msg.deleted_by || []).includes(currentUser?.id))
    .filter(msg => !deletedForMeIds.has(msg.id))
    .filter(msg => !deletedForEveryoneIds.has(msg.id));

  const filteredMessages = messageSearch
    ? baseFiltered.filter(msg =>
      (msg.text?.toLowerCase().includes(messageSearch.toLowerCase())) ||
      (msg.attachment?.name?.toLowerCase().includes(messageSearch.toLowerCase())) ||
      (msg.poll?.question?.toLowerCase().includes(messageSearch.toLowerCase()))
    )
    : baseFiltered;

  // Robust deep-link scroll: keep trying until message appears or attempts exhausted

  // Load deeplink once when entering group
  useEffect(() => {
    let raw = null;
    try { raw = localStorage.getItem('group_message_deeplink'); } catch (_) {}
    if (!raw) return;
    let deeplink = null;
    try { deeplink = JSON.parse(raw); } catch (_) { deeplink = null; }
    if (!deeplink?.groupId || !deeplink?.messageId) return;
    if (deeplink.groupId !== group?.id) return;
    setDeeplinkData(deeplink);
    deeplinkAttemptsRef.current = 0;
  }, [group?.id]);

  // Attempt scroll on message updates and with retries
  useEffect(() => {
    if (!deeplinkData || deeplinkData.groupId !== group?.id) return;

    const tryScroll = () => {
      const el = document.getElementById(`message-${deeplinkData.messageId}`);
      if (el) {
        // Prevent auto-scroll-to-bottom for a short period during deep-link focus
        setSuppressAutoScroll(true);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Slight delay to ensure styles are applied, then show longer highlight
        setTimeout(() => {
          try {
            el.classList.add('pinned-highlight');
            // Apply inline persistent style to ensure it stays highlighted
            el.style.backgroundColor = 'rgba(255, 235, 59, 0.35)';
            el.style.transition = 'background-color 0.2s ease';
          } catch {}
          highlightElRef.current = el;
          highlightTargetIdRef.current = deeplinkData.messageId;
        }, 150);
        // Do NOT auto re-enable auto-scroll; keep it suppressed until user manually scrolls
        try { localStorage.removeItem('group_message_deeplink'); } catch (_) {}
        setDeeplinkData(null);
        return true;
      }
      return false;
    };

    if (tryScroll()) return;

    if (deeplinkAttemptsRef.current < MAX_DEEPLINK_ATTEMPTS) {
      const timer = setTimeout(() => {
        deeplinkAttemptsRef.current += 1;
        // Trigger effect again via state update by setting same object (noop) but length change already re-triggers
        // We can also force by toggling a dummy state if needed, but filteredMessages change usually happens.
        tryScroll();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [deeplinkData, filteredMessages.length, group?.id]);

  return (
    <div className="imo-chat-screen">
      <GroupHeader
        group={group}
        isTyping={isTyping}
        typingUsers={currentGroupTypingUsers}
        pinnedMessages={pinnedMessages}
        onPinClick={handlePinClick}
        onUnpinMessage={togglePinMessage}
        onBackClick={onBackClick}
        setShowSearch={setShowSearch}
        startCall={startCall}
        setShowGroupInfo={setShowGroupInfo}
        setShowClearChatConfirm={(val) => val && window.confirm('Clear chat?') && clearChatForMe()}
        messageSelectionMode={messageSelectionMode}
        selectedMessages={selectedMessages}
        messages={messages}
        toggleMessageSelectionMode={toggleMessageSelectionMode}
        deleteSelectedMessages={deleteSelectedMessages}
        forwardSelectedMessages={forwardSelectedMessages}
        starSelectedMessages={() => {
          alert('Star not implemented');
          setMessageSelectionMode(false);
        }}
      />

      {showSearch && (
        <SearchBar
          messageSearch={messageSearch}
          setMessageSearch={setMessageSearch}
          setShowSearch={setShowSearch}
        />
      )}

      <MessageContainer
        filteredMessages={filteredMessages}
        currentUser={currentUser ? {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          photoURL: currentUser.photoURL
        } : null}
        group={group}
        isTyping={isTyping}
        typingUsers={currentGroupTypingUsers}
        messageSelectionMode={messageSelectionMode}
        selectedMessages={selectedMessages}
        toggleMessageSelection={toggleMessageSelection}
        showMessageOptions={showMessageOptions}
        handleMessageOptions={handleMessageOptions}
        addReaction={addReaction}
        handleReply={handleReply}
        handleForward={handleForward}
        onDirectMessage={handleDirectMessage}
        handleEditMessage={handleEditMessage}
        togglePinMessage={togglePinMessage}
        showDeleteConfirmation={showDeleteConfirmation}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        confirmDeleteMessage={deleteMessageForMe}
        onDeleteForEveryone={deleteMessageForEveryone}
        showMessageInfo={showMessageInfo}
        messageInfoDetails={messageInfoDetails}
        setMessageInfoDetails={setMessageInfoDetails}
        /* use Message component's built-in rendering (including system message banner) */
        messagesEndRef={messagesEndRef}
        onSenderClick={handleOpenProfile}
      />

      {adminOnly && !isAdmin ? (
        <div className="admin-only-footer" style={{
          display: 'flex', alignItems: 'center', gap: 8, justifyContent:"center", padding: '20px 12px',
          borderTop: '1px solid #2e2d2d46', color: '#d4cdcd9a', background: 'transparent'
        }}>
          <FiLock style={{ color: '#d97706' }} />
          <span>Only admins can send messages</span>
        </div>
      ) : (
        <InputArea
          newMessage={newMessage}
          setNewMessage={hookHandleTyping}
          onSendMessage={handleSendMessage}
          onSendPoll={hookSendPoll}
          editingMessage={messageEdit}
          onCancelEdit={() => {
            setMessageEdit(null);
            setEditMessageText('');
            setNewMessage('');
          }}
          enableVoiceMessages={true}
          onFileUpload={(e, type) => console.log('Upload not implemented')}
          replyingTo={replyTo}
          setReplyingTo={setReplyTo}
          currentUser={currentUser ? { id: currentUser.id, name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] } : null}
          contact={{ id: group?.id, name: group?.name }}
          onUserTyping={() => { }}
          voiceNoteRecording={voiceNoteRecording}
          toggleVoiceNoteRecording={toggleVoiceNoteRecording}
          voiceNoteDuration={voiceNoteDuration}
          inputRef={inputRef}
          groupMembers={group?.members || []}
        />
      )}

      {showForwardModalLocal && (
        <ForwardModal
          messages={messagesToForward}
          currentUser={currentUser}
          onClose={() => {
            setShowForwardModalLocal(false);
            setMessagesToForward([]);
          }}
          onForward={handleForwardToGroups}
        />
      )}

      {showGroupInfo && (
        <GroupInfoModal
          group={group}
          onClose={() => setShowGroupInfo(false)}
          onGroupUpdate={(updatedGroup) => {
            updatedGroup.memberCount = updatedGroup.members?.length || 0;
            setGroup(updatedGroup);
          }}
          onOpenProfile={(uid, name) => {
            // Ensure modal is closed and open profile viewer
            setShowGroupInfo(false);
            handleOpenProfile(uid, name);
          }}
        />
      )}
      {showProfileViewer && profileToView && (
        <ProfileViewer
          profile={profileToView}
          onClose={() => {
            setShowProfileViewer(false);
            setProfileToView(null);
          }}
          onToggleMute={() => console.log('Toggle mute for', profileToView.id)}
          onToggleFollow={() => console.log('Toggle follow for', profileToView.id)}
          onToggleBlock={() => console.log('Toggle block for', profileToView.id)}
          onReport={() => console.log('Report user', profileToView.id)}
        />
      )}
    </div>
  );
};