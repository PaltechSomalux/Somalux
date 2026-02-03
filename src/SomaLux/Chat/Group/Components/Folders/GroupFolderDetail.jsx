import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export const GroupFolderDetail = ({ folder, groupsMap, onGroupClick, onAddGroups, onRemoveMembers, searchQuery = '' }) => {
  const members = folder?.members || [];
  const memberGroups = useMemo(() => {
    return members
      .map((gid) => groupsMap.get(gid))
      .filter(Boolean)
      .map((g) => ({ ...g }));
  }, [members, groupsMap]);

  const normalizedQuery = (searchQuery || '').toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return memberGroups;
    return memberGroups.filter((g) => (g.name || '').toLowerCase().includes(normalizedQuery));
  }, [memberGroups, normalizedQuery]);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const pressTimer = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectionMode(false);
        setSelected(new Set());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleSelect = (gid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  const handleLongPressStart = (gid) => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelected(new Set([gid]));
    }, 500);
  };
  const handleLongPressEnd = () => clearTimeout(pressTimer.current);

  const handleItemClick = (group) => {
    if (selectionMode) {
      toggleSelect(group.id);
    } else {
      onGroupClick && onGroupClick(group);
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
    const all = new Set(memberGroups.map((g) => g.id));
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
      {filtered.length === 0 ? (
        <div className="chatme-empty-state"><p>Empty</p><button className="add-btn" onClick={onAddGroups}>Add groups</button></div>
      ) : (
        filtered.map((group) => (
          <div
            key={group.id}
            style={{ position: 'relative' }}
            onMouseDown={() => handleLongPressStart(group.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(group.id)}
            onTouchEnd={handleLongPressEnd}
          >
            <div
              className={`group-item ${selectionMode && selected.has(group.id) ? 'selected' : ''}`}
              onClick={() => handleItemClick(group)}
            >
              <div className="group-avatar">
                {group.groupPicture ? (
                  <img src={group.groupPicture} alt={group.name} className="group-avatar-circle" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                ) : (
                  <div className="group-avatar-circle" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'#334155', color:'#fff' }}>
                    {(group.name || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="group-chat-content">
                <div className="group-chat-header">
                  <div className="group-chat-name">{group.name}</div>
                  <div className="group-timestamp">{group.participants || 0} members</div>
                </div>
                <div className="group-chat-preview">
                  <div className="group-message-preview">{group.lastMessage || ''}</div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

GroupFolderDetail.propTypes = {
  folder: PropTypes.object,
  groupsMap: PropTypes.object.isRequired,
  onGroupClick: PropTypes.func,
  onAddGroups: PropTypes.func,
  onRemoveMembers: PropTypes.func,
  searchQuery: PropTypes.string,
};
