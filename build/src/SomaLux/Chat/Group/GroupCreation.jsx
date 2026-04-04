import React, { useState, useEffect, useRef } from 'react';
import { supabase, groupService } from '../../supabase';
import { FiX, FiCheck, FiUsers, FiCamera } from 'react-icons/fi';
import './GroupCreationChatmeGroups.css';

export const GroupCreation = ({ onClose, onGroupCreated }) => {
  const [step, setStep] = useState(1); // 1: Select members, 2: Group details
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupIcon, setGroupIcon] = useState(null);
  const [tempIcon, setTempIcon] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creatorFriends, setCreatorFriends] = useState([]); // Store creator's friends/chat list
  const [currentUser, setCurrentUser] = useState(null);
  
  const fileInputRef = useRef(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch creator's friends/chat list
  useEffect(() => {
    const fetchCreatorFriends = async () => {
      if (!currentUser?.id) return;

      try {
        console.log('Fetching creator friends for user:', currentUser.id);
        // Query user_conversations to get list of users they're talking to
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

        if (error) throw error;

        const friendIds = new Set();
        conversations?.forEach(conv => {
          const friendId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
          friendIds.add(friendId);
        });

        const friendUidsList = Array.from(friendIds);
        console.log('Creator friends UIDs:', friendUidsList);
        setCreatorFriends(friendUidsList);
      } catch (error) {
        console.error('Error fetching creator friends:', error);
        setCreatorFriends([]);
      }
    };

    fetchCreatorFriends();
  }, [currentUser?.id]);

  // Fetch users from creator's friends list only
  useEffect(() => {
    const fetchUsers = async () => {
      if (creatorFriends.length === 0) {
        console.log('No creator friends loaded yet, waiting...');
        return;
      }

      try {
        // Query profiles table, filtering to only creator's friends
        const { data: usersData, error } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, is_online, last_active_at')
          .in('id', creatorFriends)
          .neq('id', currentUser?.id);

        if (error) throw error;

        // Map profiles to users format
        const mappedUsers = (usersData || []).map(profile => ({
          id: profile.id,
          uid: profile.id,
          email: profile.email || 'No email',
          display_name: profile.display_name || 'Unknown User',
          full_name: profile.display_name || 'Unknown User', // For backward compatibility
          name: profile.display_name || 'Unknown User',
          avatar_url: profile.avatar_url || '',
          photoURL: profile.avatar_url || '',
          is_online: profile.is_online || false,
          last_active_at: profile.last_active_at || null,
        }));

        console.log('Available users to add (creator friends only):', mappedUsers?.length || 0);
        setUsers(mappedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };

    if (currentUser?.id) {
      fetchUsers();
    }
  }, [creatorFriends, currentUser?.id]);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle file selection and upload
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      // Immediate preview
      setTempIcon(URL.createObjectURL(selectedFile));

      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data, error } = await supabase.storage
        .from('group-icons')
        .upload(`${fileName}`, selectedFile);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('group-icons')
        .getPublicUrl(data.path);

      setGroupIcon(urlData.publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
      setTempIcon(null);
    } finally {
      setUploading(false);
      // Clear input
      e.target.value = '';
    }
  };

  // Handle next step
  const handleNext = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one member');
      return;
    }
    setError('');
    setStep(2);
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get selected users data
      const selectedUsersData = users.filter(u => selectedUsers.includes(u.id));
      
      // Create group using groupService (handles members, admins, etc.)
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || '',
        icon: groupIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
      };

      // createGroup returns the new group object with id
      const newGroup = await groupService.createGroup(groupData, currentUser.id);
      
      console.log('✅ Group created:', newGroup.id);

      // Add selected users as members to the group
      for (const userId of selectedUsers) {
        await groupService.addMember(newGroup.id, userId);
      }

      // Call success callback
      if (onGroupCreated) {
        onGroupCreated({
          id: newGroup.id,
          name: groupName.trim(),
          description: groupDescription.trim(),
          icon: groupIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
        });
      }

      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-creationChatmeGroups-overlay" onClick={onClose}>
      <div className="group-creationChatmeGroups-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-creationChatmeGroups-header">
          <div className="header-content">
            <h2 className="header-title">
              {step === 1 ? 'Select Members' : 'Group Details'}
              {step === 1 && selectedUsers.length > 0 && (
                <span className="selected-count-header"> ({selectedUsers.length} selected)</span>
              )}
            </h2>
            <div className="step-indicator">
              <div className={`step-dot ${step === 1 ? 'active' : ''}`} />
              <div className={`step-line ${step === 2 ? 'active' : ''}`} />
              <div className={`step-dot ${step === 2 ? 'active' : ''}`} />
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Step 1: Select Members */}
        {step === 1 && (
          <div className="group-creationChatmeGroups-body">
            {/* Search */}
            <div className="search-section">
              <input
                type="text"
                placeholder="Search friends by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="search-border"></div>
            </div>

            {/* Users list */}
            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <FiUsers className="empty-icon" />
                  <p>{searchQuery ? 'No friends found' : 'No friends available. Only users in your chat list can be added to groups.'}</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`user-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&size=48`}
                      alt={user.full_name}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <div className="user-name">{user.full_name}</div>
                      {selectedUsers.includes(user.id) && (
                        <div className="user-email">{user.email}</div>
                      )}
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <FiCheck className="check-icon" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Next button */}
            <div className="modal-footer">
              <button
                className="next-btn"
                onClick={handleNext}
                disabled={selectedUsers.length === 0}
              >
                Next <FiUsers />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Group Details */}
        {step === 2 && (
          <div className="group-creationChatmeGroups-body">
            {/* Group icon */}
            <div className="group-iconChatmeGroups-section">
              <div 
                className="group-iconChatmeGroups-preview"
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                {(tempIcon || groupIcon) ? (
                  <img 
                    src={tempIcon || groupIcon} 
                    alt="Group Icon" 
                    className="icon-img" 
                    onError={(e) => {
                      // Hide broken image and show placeholder letter/camera
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.group-icon-fallback')) {
                        const div = document.createElement('div');
                        div.className = 'group-icon-fallback';
                        div.textContent = (groupName || 'G').charAt(0).toUpperCase();
                        parent.appendChild(div);
                      }
                    }}
                  />
                ) : (
                  <FiCamera className="icon-placeholder" />
                )}
                {uploading && <div className="upload-spinner">Uploading...</div>}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            {/* Group name */}
            <div className="form-group">
              <label className="form-label">Group Name <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Enter your group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="form-input"
                maxLength={50}
              />
              <div className="char-count">{groupName.length}/50</div>
            </div>

            {/* Group description */}
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                placeholder="Describe your group (up to 200 characters)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="form-textarea"
                maxLength={200}
                rows={3}
              />
              <div className="char-count">{groupDescription.length}/200</div>
            </div>

            {/* Selected members preview */}
            <div className="selected-members-preview">
              <h4 className="preview-title">Members ({selectedUsers.length + 1})</h4>
              <div className="members-avatars">
                <div className="avatar-wrapper">
                  <img
                    src={currentUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.email || 'You')}&size=40`}
                    alt="You"
                    className="member-avatar"
                    title="You (Admin)"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentHTML('afterend', `<div class="member-avatar-fallback">${(currentUser?.email || 'Y').charAt(0).toUpperCase()}</div>`); }}
                  />
                  <span className="admin-badge">Admin</span>
                </div>
                {users.filter(u => selectedUsers.includes(u.id)).slice(0, 4).map(user => (
                  <div key={user.id} className="avatar-wrapper">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&size=40`}
                      alt={user.full_name}
                      className="member-avatar"
                      title={user.full_name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentHTML('afterend', `<div class="member-avatar-fallback">${(user.full_name || 'U').charAt(0).toUpperCase()}</div>`); }}
                    />
                  </div>
                ))}
                {selectedUsers.length > 4 && (
                  <div className="more-members">+{selectedUsers.length - 4}</div>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="modal-footer">
              <button className="back-btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="create-btn"
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim()}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};