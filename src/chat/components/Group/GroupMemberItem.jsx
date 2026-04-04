import React, { useState, useRef, useCallback } from 'react';
import { FiCrown, FiCheck } from 'react-icons/fi';
import { getMaskedProfilePhoto } from '../../utils/privacyVisibility';

export const GroupMemberItem = ({
  member,
  currentUser,
  isAdmin,
  isGroupCreator,
  isUserAdmin,
  getAvatarColor,
  selectionMode = false,
  selectedMemberIds = [],
  onLongPress = () => {},
  onToggleSelection = () => {},
  onOpenProfile = () => {},
  loading = false
}) => {
  const [longPressTimer, setLongPressTimer] = useState(null);

  const handleMouseDown = useCallback((e) => {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelection(member.uid);
      return;
    }
    if (isAdmin && member.uid !== currentUser?.uid && !isGroupCreator(member.uid)) {
      const timer = setTimeout(() => {
        onLongPress(member.uid);
      }, 500); // 500ms for a long press
      setLongPressTimer(timer);
    }
  }, [selectionMode, isAdmin, member.uid, currentUser?.uid, isGroupCreator, onToggleSelection, onLongPress]);

  const handleMouseUp = useCallback((e) => {
    if (selectionMode) {
      e.preventDefault();
      return;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [selectionMode, longPressTimer]);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    if (selectionMode) {
      onToggleSelection(member.uid);
      return;
    }
    if (isAdmin && member.uid !== currentUser?.uid && !isGroupCreator(member.uid)) {
      const timer = setTimeout(() => {
        onLongPress(member.uid);
      }, 500);
      setLongPressTimer(timer);
    }
  }, [selectionMode, isAdmin, member.uid, currentUser?.uid, isGroupCreator, onToggleSelection, onLongPress]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (selectionMode) {
      onToggleSelection(member.uid);
      return;
    }
    // Open profile viewer for this member
    if (typeof onOpenProfile === 'function') onOpenProfile(member.uid, member.displayName || member.name || member.email);
  }, [selectionMode, onToggleSelection, member, onOpenProfile]);

  const isSelected = selectedMemberIds.includes(member.uid);
  const isCurrentUser = member.uid === currentUser?.uid;
  const cannotRemove = isCurrentUser || isGroupCreator(member.uid);

  const maskedPhoto = getMaskedProfilePhoto(member.photoURL, member || {}, false);

  return (
    <div
      className={`member-item ${selectionMode ? 'selection-mode' : ''} ${isSelected ? 'selected' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div 
        className="member-avatar"
        style={{
          backgroundColor: maskedPhoto ? 'transparent' : getAvatarColor(member.uid)
        }}
      >
        {maskedPhoto ? (
          <img src={maskedPhoto} alt={member.displayName} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 'bold' }}>
            {(member.displayName || (member.email ? member.email.split('@')[0] : 'U'))?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        )}
        {selectionMode && (
          <div className="selection-overlay">
            {isSelected ? <FiCheck size={16} color="white" /> : <div className="selection-circle" />}
          </div>
        )}
      </div>

      <div className="member-info">
        <span className="member-name">
          {member.displayName || 
           (member.email ? member.email.split('@')[0] : 'Unknown User')}
          {isCurrentUser && ' (You)'}
        </span>
        
        {member.email && (
          <span className="member-email">{member.email}</span>
        )}
      </div>

      <div className="member-role-container">
        {isGroupCreator(member.uid) ? (
          <span className="member-role creator">Group Creator</span>
        ) : isUserAdmin(member.uid) ? (
          <span className="member-role admin">Admin</span>
        ) : (
          <span className="member-role">Member</span>
        )}
      </div>

      {loading && cannotRemove && <div className="loading-indicator">Loading...</div>}
    </div>
  );
};