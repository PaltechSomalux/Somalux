import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiFolder, FiLock } from 'react-icons/fi';
import { BiPin } from 'react-icons/bi';

export const GroupFolderList = ({ folders, onOpen, onRename, onDelete, groupsMap, searchQuery, onTogglePinFolder, onLockFolders, onUnlockFolders }) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const pressTimer = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectionMode(false);
        setSelectedIds(new Set());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startLongPress = (id) => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
    }, 500);
  };
  const endLongPress = () => clearTimeout(pressTimer.current);

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(folders.map(f => f.id)));

  const selectedCount = selectedIds.size;
  const selectedFolders = folders.filter(f => selectedIds.has(f.id));
  const anySelectedLocked = selectedFolders.some(f => f.isLocked);
  const anySelectedUnlocked = selectedFolders.some(f => !f.isLocked);

  const normalizedQuery = (searchQuery || '').toLowerCase().trim();
  const filteredFolders = (normalizedQuery
    ? folders.filter((f) => (f.name || '').toLowerCase().includes(normalizedQuery))
    : folders
  ).slice().sort((a, b) => {
    const ap = a.isPinned ? 0 : 1;
    const bp = b.isPinned ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="chatme-chat-list-items">
      <style>{`.glow-folder { position: relative; box-shadow: 0 0 6px 1px rgba(0,150,255,0.3), 0 0 12px 3px rgba(0,150,255,0.15);} .glow-folder svg { filter: drop-shadow(0 0 3px rgba(0,150,255,0.8)); } .folder-unread-badge{ position:absolute; top:-6px; right:-6px; background:#ff3b30; color:#fff; border-radius:999px; font-size:10px; line-height:1; padding:2px 6px; min-width:16px; text-align:center; box-shadow:0 0 3px rgba(0,0,0,0.3); pointer-events:none; }`}</style>
      {selectionMode && (
        <div className="chatme-selection-bar" style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #eee', flexWrap: 'wrap' }}>
          <strong>{selectedCount}</strong>
          <span>selected</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {selectedCount === 1 ? (
              <>
                <button className="chatme-all-btn" onClick={() => onRename && onRename(selectedFolders[0])}>Rename</button>
                {anySelectedUnlocked && (
                  <button className="chatme-all-btn" onClick={() => typeof onLockFolders === 'function' && onLockFolders(selectedFolders)}>Lock</button>
                )}
                {anySelectedLocked && (
                  <button className="chatme-all-btn" onClick={() => typeof onUnlockFolders === 'function' && onUnlockFolders(selectedFolders)}>Unlock</button>
                )}
                <button className="chatme-archive-btn danger" onClick={() => onDelete && onDelete(selectedFolders)}>Delete</button>
              </>
            ) : (
              <>
                <button className="chatme-all-btn" onClick={selectAll}>Select All</button>
                {anySelectedUnlocked && (
                  <button className="chatme-all-btn" onClick={() => typeof onLockFolders === 'function' && onLockFolders(selectedFolders)}>Lock</button>
                )}
                {anySelectedLocked && (
                  <button className="chatme-all-btn" onClick={() => typeof onUnlockFolders === 'function' && onUnlockFolders(selectedFolders)}>Unlock</button>
                )}
                <button className="chatme-archive-btn danger" onClick={() => onDelete && onDelete(selectedFolders)}>Delete</button>
              </>
            )}
            <button className="chatme-all-btn" onClick={cancelSelection}>Cancel</button>
          </div>
        </div>
      )}
      {filteredFolders.length === 0 ? (
        <div className="chatme-empty-state">
          <p>No folders found</p>
        </div>
      ) : (
        filteredFolders.map((f) => (
          <div
            key={f.id}
            className={`chatme-chat-item ${selectionMode && selectedIds.has(f.id) ? 'selected' : ''}`}
            onClick={() => selectionMode ? toggleSelect(f.id) : onOpen(f)}
            onMouseDown={() => startLongPress(f.id)}
            onMouseUp={endLongPress}
            onMouseLeave={endLongPress}
            onTouchStart={() => startLongPress(f.id)}
            onTouchEnd={endLongPress}
          >
            <div className="chatme-avatar-container glow-folder">
              <div className="chatme-avatar" style={{ display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
                <FiFolder color="#0096FF" size={24} />
                {(() => {
                  const unread = (f.members || []).reduce((sum, gid) => {
                    const g = groupsMap?.get(gid);
                    return sum + (g?.unreadCount || 0);
                  }, 0);
                  return unread > 0 ? (
                    <span className="folder-unread-badge">{unread}</span>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="chatme-chat-content">
              <div className="chatme-chat-header">
                <div className="chatme-chat-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {f.name}
                  {f.isLocked && <FiLock size={14} />}
                  {f.isPinned && <BiPin size={16} />}
                </div>
                <div className="chatme-timestamp">{(f.members || []).length} groups</div>
              </div>
              <div className="chatme-chat-preview" />
            </div>
            {!selectionMode && (
              <div className="chatme-options-wrapper" style={{ marginLeft: 'auto', display:'flex', gap:8 }}>
                <button
                  className="chatme-chat-options-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof onTogglePinFolder === 'function') onTogglePinFolder(f);
                  }}
                  title={f.isPinned ? 'Unpin folder' : 'Pin folder'}
                  aria-label={f.isPinned ? 'Unpin folder' : 'Pin folder'}
                >
                  <BiPin style={{ transform: f.isPinned ? 'rotate(45deg)' : 'none' }} />
                </button>
                <button
                  className="chatme-chat-options-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (f.isLocked) {
                      if (typeof onUnlockFolders === 'function') onUnlockFolders([f]);
                    } else {
                      if (typeof onLockFolders === 'function') onLockFolders([f]);
                    }
                  }}
                  title={f.isLocked ? 'Unlock folder' : 'Lock folder'}
                  aria-label={f.isLocked ? 'Unlock folder' : 'Lock folder'}
                >
                  <FiLock size={14} style={{ opacity: f.isLocked ? 1 : 0.6 }} />
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

GroupFolderList.propTypes = {
  folders: PropTypes.array.isRequired,
  onOpen: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  onDelete: PropTypes.func,
  groupsMap: PropTypes.object,
  searchQuery: PropTypes.string,
  onTogglePinFolder: PropTypes.func,
  onLockFolders: PropTypes.func,
  onUnlockFolders: PropTypes.func,
};
