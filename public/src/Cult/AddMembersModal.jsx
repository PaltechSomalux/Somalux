import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiUserPlus } from 'react-icons/fi';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './AddMembersModal.css';

export const AddMembersModal = ({ group, onClose, onMembersAdded }) => {
  const currentUser = auth.currentUser;
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [adminFriends, setAdminFriends] = useState([]); // Store admin's friends/chat list

  // Fetch admin's friends/chat list
  useEffect(() => {
    const fetchAdminFriends = async () => {
      if (!currentUser?.uid) return;

      try {
        console.log('Fetching admin friends for UID:', currentUser.uid);
        const userChatsQuery = query(
          collection(db, 'userChats', currentUser.uid, 'chats')
        );
        
        const userChatsSnapshot = await getDocs(userChatsQuery);
        const friendUids = userChatsSnapshot.docs
          .filter(doc => doc.id !== 'trigger' && !doc.data().isDeleted)
          .map(doc => doc.id);
        
        console.log('Admin friends UIDs:', friendUids);
        setAdminFriends(friendUids);
      } catch (error) {
        console.error('Error fetching admin friends:', error);
        setAdminFriends([]);
      }
    };

    fetchAdminFriends();
  }, [currentUser?.uid]);

  // Listen to real-time updates for the group document to get current members
  useEffect(() => {
    if (!group?.id) return;

    const groupRef = doc(db, 'groups', group.id);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        console.log('Full group data from Firestore:', groupData);

        // Robustly extract member UIDs whether 'members' is array of objects or strings
        let memberIds = [];
        const rawMembers = groupData.members;
        if (Array.isArray(rawMembers) && rawMembers.length > 0) {
          memberIds = rawMembers.map((m) => {
            if (typeof m === 'string') return m;
            if (m && typeof m === 'object') return m.uid || m.id || null;
            return null;
          }).filter(Boolean);
        } else if (Array.isArray(groupData.memberIds)) {
          memberIds = groupData.memberIds;
        }

        console.log('Extracted member IDs (normalized):', memberIds);
        setCurrentGroupMembers(memberIds);
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
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        console.log('Current group members from Firestore:', currentGroupMembers);
        console.log('Admin friends UIDs:', adminFriends);
        console.log('All users from Firestore:', querySnapshot.docs.length);
        
        const rawUsers = querySnapshot.docs
          .map(doc => {
            const data = doc.data() || {};
            const name = data.displayName || data.name || data.fullName || data.username || (data.email ? data.email.split('@')[0] : undefined);
            return { uid: doc.id, ...data, displayName: name };
          });

        // Dedupe by uid in case of any anomalies
        const dedupedUsers = Array.from(new Map(rawUsers.map(u => [u.uid, u])).values());

        const usersList = dedupedUsers
          .filter(user => {
            const isCurrentUser = user.uid === currentUser?.uid;
            const isExistingMember = currentGroupMembers.includes(user.uid);
            const isAdminFriend = adminFriends.includes(user.uid);
            const shouldInclude = !isCurrentUser && !isExistingMember && isAdminFriend;
            
            console.log(`User: ${user.displayName || user.email?.split('@')[0] || 'Unknown'} (${user.uid})`);
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

    fetchAllUsers();
  }, [currentGroupMembers, adminFriends, currentUser?.uid]);

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
      prev.some(u => u.uid === user.uid)
        ? prev.filter(u => u.uid !== user.uid)
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
      const groupRef = doc(db, 'groups', group.id);
      const newMemberUids = selectedUsers.map(user => user.uid);
      
      // 1) Update memberIds so users see the group in their list
      await updateDoc(groupRef, {
        memberIds: arrayUnion(...newMemberUids)
      });

      // 2) Optionally also append to members with rich objects (keeps schema consistent with creation)
      const memberObjects = selectedUsers.map(u => ({
        uid: u.uid,
        name: u.displayName || u.name || u.fullName || u.username || (u.email ? u.email.split('@')[0] : 'User'),
        email: u.email || '',
        photoURL: u.photoURL || null,
        role: 'member',
        joinedAt: serverTimestamp(),
      }));

      // Filter out those already present to avoid duplicate member objects
      const toAddObjects = memberObjects.filter(m => !currentGroupMembers.includes(m.uid));
      try {
        if (toAddObjects.length > 0) {
          await updateDoc(groupRef, {
            members: arrayUnion(...toAddObjects)
          });
        }
      } catch (e) {
        console.warn('Failed to append rich member objects, continuing with memberIds only:', e?.message || e);
      }

      // 3) Post a single system message about added members (real-time visible)
      try {
        const adderName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin';
        const names = selectedUsers.map(u => u.displayName || u.name || (u.email ? u.email.split('@')[0] : u.uid));
        const text = names.length === 1
          ? `${names[0]} was added by ${adderName}`
          : `${names.join(', ')} were added by ${adderName}`;
        await addDoc(collection(db, 'groups', group.id, 'messages'), {
          sender: 'system',
          senderName: 'System',
          type: 'system',
          text,
          timestamp: serverTimestamp(),
          status: 'delivered',
          readBy: [],
          isPinned: false,
        });
      } catch (e) {
        console.warn('Failed to write add-members system message', e);
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
    for (let i = 0; i < userId?.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
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
                key={user.uid} 
                className={`add-member-item ${selectedUsers.some(u => u.uid === user.uid) ? 'selected' : ''}`}
                onClick={() => handleSelectUser(user)}
              >
                <div 
                  className="member-avatar"
                  style={{
                    backgroundColor: user.photoURL ? 'transparent' : getAvatarColor(user.uid)
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
                    {user.displayName || 
                     (user.email ? user.email.split('@')[0] : 'Unknown User')}
                  </span>
                  <span className="member-email">{user.email}</span>
                </div>
                {selectedUsers.some(u => u.uid === user.uid) && (
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
