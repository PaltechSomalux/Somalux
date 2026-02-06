import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChatItem } from '../ChatItem';

export const FolderDetail = ({ folder, chatsMap, onChatClick, onAddChats, onRemoveMembers, typingUsers = {}, onlineUsers = new Set(), searchQuery = '' }) => {
  const members = folder?.members || [];
  const memberChats = useMemo(() => {
    return members
      .map((uid) => chatsMap.get(uid))
      .filter(Boolean)
      .map((chat) => ({
        ...chat,
        isTyping: Boolean(typingUsers[chat.uid]),
        isOnline: onlineUsers.has(chat.uid) || chat.isOnline,
      }));
  }, [members, chatsMap, typingUsers, onlineUsers]);

  const normalizedQuery = (searchQuery || '').toLowerCase().trim();
  const filteredChats = useMemo(() => {
    if (!normalizedQuery) return memberChats;
    return memberChats.filter((c) => (c.name || '').toLowerCase().includes(normalizedQuery));
  }, [memberChats, normalizedQuery]);

  // Selection mode via long-press
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const pressTimer = useRef(null);
  const [openMenuUid, setOpenMenuUid] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectionMode(false);
        setSelected(new Set());
        setOpenMenuUid(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleSelect = (uid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleLongPressStart = (uid) => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelected(new Set([uid]));
    }, 500);
  };
  const handleLongPressEnd = () => {
    clearTimeout(pressTimer.current);
  };

  const handleItemClick = (chat) => {
    if (selectionMode) {
      toggleSelect(chat.uid);
    } else {
      onChatClick(chat);
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const removeSelected = () => {
    if (onRemoveMembers && selected.size > 0) {
      onRemoveMembers(Array.from(selected));
      cancelSelection();
    }
  };

  const selectAll = () => {
    const all = new Set(memberChats.map((c) => c.uid));
    setSelected(all);
    setSelectionMode(true);
  };

  return (
    <div className="chatme-chat-list-items">
      {selectionMode && (
        <div className="chatme-selection-bar" style={{ position:'sticky', top:0, zIndex:5, display:'flex', alignItems:'center', gap:12, padding:'8px 12px', borderBottom:'1px solid #eee', flexWrap:'wrap' }}>
          <strong>{selected.size}</strong>
          <span>selected</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:12, flexWrap:'wrap' ,marginRight:12}}>
            <button className="chatme-all-btn" onClick={selectAll}>Select All</button>
            <button className="chatme-archive-btn danger" onClick={removeSelected}>Remove</button>
            <button className="chatme-all-btn" onClick={cancelSelection}>Cancel</button>
          </div>
        </div>
      )}
      {filteredChats.length === 0 ? (
        <div className="chatme-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px', gap: '16px', minHeight: '200px' }}>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>Empty</p>
          <button className="add-btn" onClick={onAddChats} style={{ background: 'none', color: 'rgb(156, 153, 153)', fontSize: '12px', fontWeight: '300', cursor: 'pointer', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'inline-block' }}>Add chats</button>
        </div>
      ) : (
        filteredChats.map((chat) => (
          <div
            key={chat.uid}
            style={{ position: 'relative' }}
            onMouseDown={() => handleLongPressStart(chat.uid)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(chat.uid)}
            onTouchEnd={handleLongPressEnd}
          >
            <ChatItem
              chat={chat}
              onClick={() => handleItemClick(chat)}
              onAvatarClick={() => handleItemClick(chat)}
              onOptionsClick={null}
              showOptions={false}
              onArchive={() => {}}
              onUnarchive={() => {}}
              onToggleMute={() => {}}
              onTogglePin={() => {}}
              onToggleLock={() => {}}
              onDelete={() => {}}
              onLongPress={() => {}}
              onSelect={() => {}}
              isActive={false}
              isSelected={selected.has(chat.uid)}
              isSelectionMode={selectionMode}
            />
          </div>
        ))
      )}
      {/* No bottom add button when there are chats */}
    </div>
  );
};

FolderDetail.propTypes = {
  folder: PropTypes.object.isRequired,
  chatsMap: PropTypes.instanceOf(Map).isRequired,
  onChatClick: PropTypes.func.isRequired,
  onAddChats: PropTypes.func.isRequired,
  onRemoveMembers: PropTypes.func,
  typingUsers: PropTypes.object,
  onlineUsers: PropTypes.instanceOf(Set),
  searchQuery: PropTypes.string,
};
