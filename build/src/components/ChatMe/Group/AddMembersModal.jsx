import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiUserPlus } from 'react-icons/fi';
import { supabase, groupService } from '../../../supabase';
import './AddMembersModal.css';

export const AddMembersModal = ({ group, onClose, onMembersAdded }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [adminFriends, setAdminFriends] = useState([]); // Store admin's friends/chat list

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch admin's friends/chat list
  useEffect(() => {
    const fetchAdminFriends = async () => {
      if (!currentUser?.id) return;

      try {
        console.log('Fetching admin friends for user:', currentUser.id);
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
        console.log('Admin friends IDs:', friendUidsList);
        setAdminFriends(friendUidsList);
      } catch (error) {
        console.error('Error fetching admin friends:', error);
        setAdminFriends([]);
      }
    };

    fetchAdminFriends();
  }, [currentUser?.id]);

  // Listen to real-time updates for the group document to get current members
  useEffect(() => {
    if (!group?.id) return;

    const unsubscribe = groupService.subscribeToGroup(group.id, (payload) => {
      if (payload.new) {
        const groupData = payload.new;
        console.log('Full group data from Supabase:', groupData);
        // Members will be fetched from group_members table via getGroupMembersWithDetails
        setCurrentGroupMembers(groupData.member_ids || []);
      }
    });

    return () => unsubscribe();
  }, [group?.id]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (adminFriends.length === 0) {
        console.log('No admin friends loaded yet, waiting...');
        return;
      }

      setFetchingUsers(true);
      try {
        // Query profiles table with admin's friends filter (NOT users table)
        const { data: usersData, error } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, is_online, last_active_at')
          .in('id', adminFriends);

        if (error) throw error;

        console.log('Current group members:', currentGroupMembers);
        console.log('Admin friends IDs:', adminFriends);
        console.log('All users from Supabase:', usersData?.length || 0);
        
        const usersList = (usersData || [])
          .map(user => ({
            id: user.id,
            uid: user.id,
            email: user.email || 'No email',
            displayName: user.display_name || 'Unknown User',
            name: user.display_name || 'Unknown User',
            photoURL: user.avatar_url || '',
            isOnline: user.is_online || false,
            lastActiveAt: user.last_active_at || null,
          }))
          .filter(user => {
            const isCurrentUser = user.id === currentUser?.id;
            const isExistingMember = currentGroupMembers.includes(user.id);
            const isAdminFriend = adminFriends.includes(user.id);
            const shouldInclude = !isCurrentUser && !isExistingMember && isAdminFriend;
            
            console.log(`User: ${user.displayName} (${user.id})`);
            console.log(`  - Is current user: ${isCurrentUser}`);
            console.log(`  - Is existing member: ${isExistingMember}`);
            console.log(`  - Is admin friend: ${isAdminFriend}`);
            console.log(`  - Should include: ${shouldInclude}`);
            
            return shouldInclude;
          });
        
        console.log('Available users to add (admin friends only):', usersList.length);
        setAllUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching all users:', error);
        window.alert('Failed to fetch users.');
      } finally {
        setFetchingUsers(false);
      }
    };

    if (currentUser?.id) {
      fetchAllUsers();
    }
  }, [currentGroupMembers, adminFriends, currentUser?.id]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = allUsers.filter(user =>
      (user.displayName && user.displayName.toLowerCase().includes(lowercasedSearchTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowercasedSearchTerm))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, allUsers]);

  const handleSelectUser = (user) => {
    setSelectedUsers(prev => 
      prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      window.alert('Please select at least one member to add.');
      return;
    }

    setLoading(true);
    try {
      // Add each selected user to the group using groupService
      for (const user of selectedUsers) {
        await groupService.addMember(group.id, user.id);
      }

      if (onMembersAdded) {
        onMembersAdded(selectedUsers);
      }
      onClose();
      console.log('✅ Members added to group');
    } catch (error) {
      console.error('Error adding members to group:', error);
      window.alert('Failed to add members.');
    } finally {
      setLoading(false);
    }
  };

  // Generate consistent color based on user ID
  const getAvatarColor = (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
      '#FF8C94', '#A8DADC', '#E63946', '#F4A261', '#2A9D8F'
    ];
    
    let hash = 0;
    for (let i = 0; i < (userId || '').length; i++) {
      hash = (userId || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="add-members-modal-overlay" onClick={onClose}>
      <div className="add-members-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-members-header">
          <h2>Add Members</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="add-members-search">
          <FiSearch size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search friends by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="add-members-list">
          {fetchingUsers ? (
            <p className="loading-message">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="no-users-message">
              No friends available to add. Only users in your chat list can be added to groups.
            </p>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.id} 
                className={`add-member-item ${selectedUsers.some(u => u.id === user.id) ? 'selected' : ''}`}
                onClick={() => handleSelectUser(user)}
              >
                <div 
                  className="member-avatar"
                  style={{
                    backgroundColor: user.photoURL ? 'transparent' : getAvatarColor(user.id)
                  }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                      {(user.displayName || (user.email ? user.email.split('@')[0] : 'U'))?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="member-info">
                  <span className="member-name">
                    {user.displayName || 'Unknown User'}
                  </span>
                  <span className="member-email">{user.email}</span>
                </div>
                {selectedUsers.some(u => u.id === user.id) && (
                  <FiUserPlus size={20} className="selected-icon" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="add-members-footer">
          <button 
            className="add-btn" 
            onClick={handleAddMembers} 
            disabled={selectedUsers.length === 0 || loading}
          >
            {loading ? 'Adding...' : `Add ${selectedUsers.length} Member(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};
