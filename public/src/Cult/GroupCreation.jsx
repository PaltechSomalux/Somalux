import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  query
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { FiX, FiCheck, FiUsers, FiCamera } from 'react-icons/fi';
import './GroupCreation.css';

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
  
  const currentUser = auth.currentUser;
  const fileInputRef = useRef(null);

  // Fetch creator's friends/chat list
  useEffect(() => {
    const fetchCreatorFriends = async () => {
      if (!currentUser?.uid) return;

      try {
        console.log('Fetching creator friends for UID:', currentUser.uid);
        const userChatsQuery = query(
          collection(db, 'userChats', currentUser.uid, 'chats')
        );
        
        const userChatsSnapshot = await getDocs(userChatsQuery);
        const friendUids = userChatsSnapshot.docs
          .filter(doc => doc.id !== 'trigger' && !doc.data().isDeleted)
          .map(doc => doc.id);
        
        console.log('Creator friends UIDs:', friendUids);
        setCreatorFriends(friendUids);
      } catch (error) {
        console.error('Error fetching creator friends:', error);
        setCreatorFriends([]);
      }
    };

    fetchCreatorFriends();
  }, [currentUser?.uid]);

  // Fetch users from creator's friends list only
  useEffect(() => {
    const fetchUsers = async () => {
      if (creatorFriends.length === 0) {
        console.log('No creator friends loaded yet, waiting...');
        return;
      }

      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => {
            const isCurrentUser = user.uid === currentUser?.uid;
            const isCreatorFriend = creatorFriends.includes(user.uid);
            return !isCurrentUser && isCreatorFriend;
          });
        
        console.log('Available users to add (creator friends only):', usersList.length);
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };

    fetchUsers();
  }, [creatorFriends, currentUser]);

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

      // Upload to Firebase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, `group-icons/${fileName}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      setGroupIcon(downloadURL);
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
      const selectedUsersData = users.filter(u => selectedUsers.includes(u.uid));
      
      // Create members array with current user
      const members = [
        {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email,
          photoURL: currentUser.photoURL || null,
          role: 'admin', // Creator is admin
          joinedAt: new Date(),
        },
        ...selectedUsersData.map(user => ({
          uid: user.uid,
          name: user.name || user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL || null,
          role: 'member',
          joinedAt: new Date(),
        }))
      ];

      // Create group document
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        description: groupDescription.trim() || '',
        icon: groupIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: members,
        memberIds: members.map(m => m.uid),
        admins: [currentUser.uid],
        lastActivity: serverTimestamp(),
      });

      console.log('✅ Group created:', groupRef.id);

      // Create initial welcome message
      await addDoc(collection(db, 'groups', groupRef.id, 'messages'), {
        sender: 'system',
        senderName: 'System',
        text: `${currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin'} created this group`,
        timestamp: serverTimestamp(),
        status: 'delivered',
        readBy: [currentUser.uid],
        deletedBy: [],
        isPinned: false,
      });

      // Create group invitations for selected users
      for (const userId of selectedUsers) {
        await setDoc(doc(db, 'groupInvitations', `${groupRef.id}_${userId}`), {
          groupId: groupRef.id,
          groupName: groupName.trim(),
          userId: userId,
          invitedBy: currentUser.uid,
          invitedByName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          status: 'pending', // pending, accepted, rejected
          createdAt: serverTimestamp(),
        });
      }

      // Call success callback
      if (onGroupCreated) {
        onGroupCreated({
          id: groupRef.id,
          name: groupName.trim(),
          description: groupDescription.trim(),
          icon: groupIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
          members: members,
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
    <div className="group-creation-overlay" onClick={onClose}>
      <div className="group-creation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-creation-header">
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
          <div className="group-creation-body">
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
                    key={user.uid}
                    className={`user-item ${selectedUsers.includes(user.uid) ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(user.uid)}
                  >
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&size=48`}
                      alt={user.name}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <div className="user-name">{user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Unknown User')}</div>
                      {selectedUsers.includes(user.uid) && (
                        <div className="user-email">{user.email}</div>
                      )}
                    </div>
                    {selectedUsers.includes(user.uid) && (
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
          <div className="group-creation-body">
            {/* Group icon */}
            <div className="group-icon-section">
              <div 
                className="group-icon-preview"
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
                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.email || 'You')}&size=40`}
                    alt="You"
                    className="member-avatar"
                    title="You (Admin)"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentHTML('afterend', `<div class="member-avatar-fallback">${(currentUser?.email || 'Y').charAt(0).toUpperCase()}</div>`); }}
                  />
                  <span className="admin-badge">Admin</span>
                </div>
                {users.filter(u => selectedUsers.includes(u.uid)).slice(0, 4).map(user => (
                  <div key={user.uid} className="avatar-wrapper">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&size=40`}
                      alt={user.name}
                      className="member-avatar"
                      title={user.name || user.email}
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentHTML('afterend', `<div class="member-avatar-fallback">${(user.name || user.email || 'U').charAt(0).toUpperCase()}</div>`); }}
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