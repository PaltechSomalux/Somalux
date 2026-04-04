import React, { useState, useEffect } from 'react';
import { supabase, groupService } from '../../../supabase';
import './ForwardModal.css';

export const ForwardModal = ({
  messages = [],
  currentUser,
  onClose,
  onForward,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedIconIds, setFailedIconIds] = useState({});

  // Load user's groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!currentUser?.id) return;

      try {
        const groups = await groupService.getGroups(currentUser.id);
        setGroups(groups);
        setLoading(false);
      } catch (error) {
        console.error('Error loading groups:', error);
        setLoading(false);
      }
    };

    loadGroups();
  }, [currentUser?.id]);

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle selection
  const toggleSelection = (targetId) => {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  // Handle forward
  const handleForward = () => {
    if (selectedTargets.length > 0) {
      onForward(messages, selectedTargets);
      onClose();
    }
  };

  return (
    <div className="forward-modal-overlay" onClick={onClose}>
      <div className="forward-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="forward-modal-header">
          <h3>Forward to...</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="forward-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="forward-search-input"
          />
        </div>

        <div className="forward-list">
          {loading ? (
            <div className="forward-loading">Loading groups...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="forward-empty">
              {searchQuery ? 'No groups found' : 'No groups available'}
            </div>
          ) : (
            filteredGroups.map(group => (
              <div
                key={group.id}
                className={`forward-item ${selectedTargets.includes(group.id) ? 'selected' : ''}`}
                onClick={() => toggleSelection(group.id)}
              >
                <div className="forward-item-avatar">
                  {group.icon && !failedIconIds[group.id] ? (
                    <img
                      src={group.icon}
                      alt={group.name}
                      onError={() => setFailedIconIds(prev => ({ ...prev, [group.id]: true }))}
                    />
                  ) : (
                    <span className="forward-item-initial" title={group.name}>
                      {group.name?.charAt(0)?.toUpperCase() || '👤'}
                    </span>
                  )}
                </div>
                <div className="forward-item-info">
                  <div className="forward-item-name">{group.name}</div>
                  <div className="forward-item-subtitle">
                    {group.members?.length || 0} members
                  </div>
                </div>
                <div className="forward-item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(group.id)}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="checkmark" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="forward-modal-footer">
          <div className="forward-selection-count">
            {selectedTargets.length > 0
              ? `${selectedTargets.length} group${selectedTargets.length > 1 ? 's' : ''} selected`
              : 'Select groups to forward'}
          </div>
          <button
            onClick={handleForward}
            disabled={selectedTargets.length === 0}
            className="forward-submit-button"
          >
            <svg className="forward-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
