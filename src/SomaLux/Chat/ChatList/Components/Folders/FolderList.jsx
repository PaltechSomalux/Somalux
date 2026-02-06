import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiFolder, FiLock, FiMoreVertical } from 'react-icons/fi';
import { BiPin } from 'react-icons/bi';

export const FolderList = ({ folders, onOpen, onRename, onDelete, chatsMap, searchQuery, onTogglePinFolder, onLockFolders, onUnlockFolders }) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showMenu, setShowMenu] = useState(null); // Track which folder's menu is open
  const [menuPosition, setMenuPosition] = useState({});
  const pressTimer = useRef(null);
  const menuButtonRefs = useRef({});

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectionMode(false);
        setSelectedIds(new Set());
        setShowMenu(null);
        setMenuPosition({});
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

  const handleMenuToggle = (folderId, e) => {
    e.stopPropagation();
    if (showMenu === folderId) {
      setShowMenu(null);
      setMenuPosition({});
    } else {
      const buttonRef = menuButtonRefs.current[folderId];
      if (buttonRef) {
        const buttonRect = buttonRef.getBoundingClientRect();
        const top = buttonRect.bottom + window.scrollY;
        const right = window.innerWidth - buttonRect.right;
        setMenuPosition({
          top: `${top}px`,
          right: `${right}px`
        });
        setShowMenu(folderId);
      }
    }
  };

  const handleMenuAction = (action, folder, e) => {
    e.stopPropagation();
    console.log('FolderList: handleMenuAction called', { action, folderId: folder.id, folderName: folder.name });
    setShowMenu(null);
    setMenuPosition({});

    switch (action) {
      case 'rename':
        console.log('FolderList: calling onRename with folder', folder);
        if (onRename) {
          onRename(folder);
        } else {
          console.warn('FolderList: onRename callback not provided');
        }
        break;
      case 'lock':
        if (folder.isLocked) {
          if (onUnlockFolders) onUnlockFolders([folder]);
        } else {
          if (onLockFolders) onLockFolders([folder]);
        }
        break;
      case 'delete':
        console.log('FolderList: calling onDelete with folder', folder);
        if (onDelete) {
          onDelete([folder]);
        } else {
          console.warn('FolderList: onDelete callback not provided');
        }
        break;
      default:
        break;
    }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e) => {
      const menuButton = menuButtonRefs.current[showMenu];
      // Only close if clicking outside both the button AND the menu
      if (menuButton && !menuButton.contains(e.target)) {
        // Check if the click is on a menu item (which should have the context-menu-item class)
        const isMenuItemClick = e.target.closest('.folder-context-menu');
        if (!isMenuItemClick) {
          setShowMenu(null);
          setMenuPosition({});
        }
      }
    };
    // Use setTimeout to delay the listener so it doesn't interfere with the initial click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', onDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onDown);
    };
  }, [showMenu]);

  const selectedCount = selectedIds.size;
  const selectedFolders = folders.filter(f => selectedIds.has(f.id));
  const anySelectedLocked = selectedFolders.some(f => f.isLocked);
  const anySelectedUnlocked = selectedFolders.some(f => !f.isLocked);

  const normalizedQuery = (searchQuery || '').toLowerCase().trim();
  const filteredFolders = (normalizedQuery
    ? folders.filter((f) => (f.name || '').toLowerCase().includes(normalizedQuery))
    : folders
  ).slice().sort((a, b) => {
    // Pinned first, then by name
    const ap = a.isPinned ? 0 : 1;
    const bp = b.isPinned ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="chatme-chat-list-items">
      <style>
        .glow-folder {`
  position: relative;
  /* Reduced spread and blur, lower opacity */
  box-shadow: 
    0 0 6px 1px rgba(0, 150, 255, 0.3),     /* Tight inner glow */
    0 0 12px 3px rgba(0, 150, 255, 0.15);   /* Subtle outer glow */
}

.glow-folder svg {
  /* Much softer drop-shadow */
  filter: drop-shadow(0 0 3px rgba(0, 150, 255, 0.8));
}

.folder-unread-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3b30;
  color: #fff;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  min-width: 16px;
  text-align: center;
  /* Optional: reduce badge shadow too for consistency */
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  pointer-events: none;
`}
      </style>
      {selectionMode && (
        <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0', padding: '10px 14px', borderBottom: '1px solid #2a3942', background: '#0b1216' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <strong style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{selectedCount}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', justifyContent: 'space-between', flex: 1, marginLeft: '12px' }}>
            {selectedCount === 1 ? (
              <>
                <button className="soma-all-btn" onClick={() => { onRename && onRename(selectedFolders[0]); cancelSelection(); }} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: 'rgb(156, 153, 153)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Rename</button>
                {anySelectedUnlocked && (
                  <button className="soma-all-btn" onClick={() => { typeof onLockFolders === 'function' && onLockFolders(selectedFolders); cancelSelection(); }} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: 'rgb(156, 153, 153)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Lock</button>
                )}
                {anySelectedLocked && (
                  <button className="soma-all-btn" onClick={() => { typeof onUnlockFolders === 'function' && onUnlockFolders(selectedFolders); cancelSelection(); }} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: 'rgb(156, 153, 153)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Unlock</button>
                )}
              </>
            ) : (
              <button className="soma-all-btn" onClick={() => { selectAll(); }} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: 'rgb(156, 153, 153)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Select All</button>
            )}
            <button className="soma-archive-btn" onClick={() => { onDelete && onDelete(selectedFolders); cancelSelection(); }} style={{ padding: '8px 16px', background: 'rgba(255,59,48,0.1)', border: 'none', borderRadius: '4px', color: '#ff6b5b', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Delete</button>
            <button className="soma-all-btn" onClick={cancelSelection} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #2a3942', borderRadius: '4px', color: 'rgb(156, 153, 153)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Cancel</button>
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
              <div
                className="chatme-avatar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <FiFolder color="#0096FF" size={24} />
                {(() => {
                  const unread = (f.members || []).reduce((sum, uid) => {
                    const c = chatsMap?.get(uid);
                    return sum + (c?.unreadCount || 0);
                  }, 0);
                  return unread > 0 ? (
                    <span className="folder-unread-badge" style={{ fontSize: '7px', background: '#ff6b6b' }}>{unread}</span>
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
                <div className="chatme-timestamp" style={{ fontSize: '10px', color: '#999' }}>{(f.members || []).length} chats</div>

              </div>
              <div className="chatme-chat-preview">
              </div>
            </div>
            {!selectionMode && (
              <div className="chatme-options-wrapper" style={{ marginLeft: 'auto', position: 'relative' }}>
                <button
                  ref={(el) => menuButtonRefs.current[f.id] = el}
                  className="chatme-chat-options-button folder-options-button"
                  onClick={(e) => handleMenuToggle(f.id, e)}
                  title="Folder options"
                  aria-label="Folder options"
                >
                  <FiMoreVertical />
                </button>
                {showMenu === f.id && (
                  <div className="folder-context-menu" style={menuPosition}>
                    <button 
                      className="context-menu-item" 
                      onClick={(e) => handleMenuAction('rename', f, e)}
                      type="button"
                    >
                      Rename
                    </button>
                    <button 
                      className="context-menu-item" 
                      onClick={(e) => handleMenuAction('lock', f, e)}
                      type="button"
                    >
                      {f.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    <button 
                      className="context-menu-item delete" 
                      onClick={(e) => handleMenuAction('delete', f, e)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

FolderList.propTypes = {
  folders: PropTypes.array.isRequired,
  onOpen: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  onDelete: PropTypes.func,
  chatsMap: PropTypes.instanceOf(Map),
  searchQuery: PropTypes.string,
  onTogglePinFolder: PropTypes.func,
};
