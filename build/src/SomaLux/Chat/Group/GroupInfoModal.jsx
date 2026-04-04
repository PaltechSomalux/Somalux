import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiUserPlus, FiCheck, FiMoreVertical, FiChevronRight } from 'react-icons/fi';
import { supabase, groupService } from '../../supabase';
import './GroupInfoModalChatmeGroups.css';
import { AddMembersModal } from './AddMembersModal';
import { GroupMemberItem } from './GroupMemberItem';

export const GroupInfoModal = ({ group: initialGroup, onClose, onGroupUpdate, onOpenProfile }) => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const [localGroup, setLocalGroup] = useState(initialGroup);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(initialGroup?.description || '');
  const [members, setMembers] = useState(initialGroup?.members || []);
  const [loading, setLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showKebab, setShowKebab] = useState(false);
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileName, setProfileName] = useState(initialGroup?.name || '');
  const [profileIcon, setProfileIcon] = useState(initialGroup?.icon || '');

  // Listen to real-time updates for the group document
  useEffect(() => {
    if (!initialGroup?.id) return;

    const subscription = groupService.subscribeToGroup(initialGroup.id, (payload) => {
      if (payload.new) {
        setLocalGroup({ id: payload.new.id, ...payload.new });
        setDescription(payload.new.description || '');
      }
    });

    return () => subscription();
  }, [initialGroup?.id]);

  // Check if current user is admin (using localGroup)
  const isAdmin = currentUser && (
    localGroup?.created_by === currentUser.id || 
    localGroup?.admins?.includes(currentUser.id)
  );

  const isUserAdmin = (userId) => {
    return userId === localGroup?.created_by || localGroup?.admins?.includes(userId);
  };

  // Toggle onlyAdminsCanSend
  const handleToggleSendRestriction = async () => {
    if (!isAdmin || !localGroup?.id) return;
    const next = !localGroup?.only_admins_can_send;
    setLoading(true);
    try {
      await groupService.updateGroup(localGroup.id, { only_admins_can_send: next });
    } catch (e) {
      console.error('Failed to toggle sending restriction', e);
      window.alert('Failed to update setting');
    } finally {
      setLoading(false);
      setShowKebab(false);
      setShowSettingsSubmenu(false);
    }
  };

  // Save profile changes (name/icon)
  const handleSaveProfile = async () => {
    if (!isAdmin || !localGroup?.id) return;
    const name = profileName.trim();
    const icon = profileIcon.trim();
    if (!name && !icon) { setShowProfileDialog(false); return; }
    setLoading(true);
    try {
      const update = {};
      if (name) update.name = name;
      if (icon) update.icon = icon;
      await groupService.updateGroup(localGroup.id, update);
      setShowProfileDialog(false);
      if (onGroupUpdate) onGroupUpdate(localGroup);
    } catch (e) {
      console.error('Failed to save profile', e);
      window.alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isGroupCreator = (userId) => {
    return userId === localGroup?.createdBy;
  };

  // Load full member details from the union of memberIds and members[*].uid
  useEffect(() => {
    const loadMemberDetails = async () => {
      if (!localGroup?.id) return;

      try {
        // Build a unified set of member IDs
        const idSet = new Set();
        const richMap = new Map(); // uid -> rich data from members array if present

        if (Array.isArray(localGroup.memberIds)) {
          localGroup.memberIds.forEach((uid) => { if (uid) idSet.add(String(uid)); });
        }

        if (Array.isArray(localGroup.members)) {
          localGroup.members.forEach((m) => {
            if (typeof m === 'string') {
              const uid = String(m);
              if (uid) idSet.add(uid);
            } else if (m && typeof m === 'object') {
              const uid = m.uid || m.id;
              if (uid) {
                idSet.add(String(uid));
                // Normalize and keep the richer data for display preference
                const name = m.displayName || m.name || m.fullName || m.username || (m.email ? m.email.split('@')[0] : undefined);
                richMap.set(String(uid), {
                  uid: String(uid),
                  displayName: name,
                  email: m.email,
                  photoURL: m.photoURL
                });
              }
            }
          });
        }

        const uids = Array.from(idSet);

        // Resolve display records: prefer rich object, otherwise fetch from users
        const memberDetails = await Promise.all(uids.map(async (uid) => {
          if (richMap.has(uid)) return richMap.get(uid);
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const d = userDoc.data() || {};
            const name = d.displayName || d.name || d.fullName || d.username || (d.email ? d.email.split('@')[0] : undefined);
            return { uid, displayName: name, email: d.email, photoURL: d.photoURL };
          }
          return { uid, displayName: 'Unknown User' };
        }));

        // Dedupe by uid to avoid duplicates
        const uniqueByUid = Array.from(new Map(memberDetails.map(m => [m.uid, m])).values());
        
        // Sort members: Current User first, then Group Creator, then Admins, then Members
        const sortedMembers = uniqueByUid.sort((a, b) => {
          const aIsCurrentUser = a.uid === currentUser?.uid;
          const bIsCurrentUser = b.uid === currentUser?.uid;
          const aIsCreator = a.uid === localGroup?.createdBy;
          const bIsCreator = b.uid === localGroup?.createdBy;
          const aIsAdmin = localGroup?.admins?.includes(a.uid);
          const bIsAdmin = localGroup?.admins?.includes(b.uid);

          // Current user always first
          if (aIsCurrentUser && !bIsCurrentUser) return -1;
          if (!aIsCurrentUser && bIsCurrentUser) return 1;

          // Creator second (if not current user)
          if (aIsCreator && !bIsCreator) return -1;
          if (!aIsCreator && bIsCreator) return 1;

          // Admins next
          if (aIsAdmin && !bIsAdmin) return -1;
          if (!aIsAdmin && bIsAdmin) return 1;
          
          // Sort by name if same role
          const aName = a.displayName || a.email || '';
          const bName = b.displayName || b.email || '';
          return aName.localeCompare(bName);
        });
        
        setMembers(sortedMembers);
      } catch (error) {
        console.error('Error loading member details:', error);
        // Fallback: show what we can from either field
        const fallback = [];
        if (Array.isArray(localGroup.memberIds)) {
          localGroup.memberIds.forEach((uid, idx) => fallback.push({ uid: String(uid) || `member-${idx}`, displayName: 'User' }));
        } else if (Array.isArray(localGroup.members)) {
          localGroup.members.forEach((m, idx) => {
            if (typeof m === 'object' && m) {
              fallback.push({ uid: m.uid || m.id || `member-${idx}`, displayName: m.displayName || m.name || 'User', email: m.email, photoURL: m.photoURL });
            } else {
              fallback.push({ uid: String(m) || `member-${idx}`, displayName: 'User' });
            }
          });
        }
        setMembers(fallback);
      }
    };

    loadMemberDetails();
  }, [localGroup?.memberIds, localGroup?.members, localGroup?.createdBy, localGroup?.admins, currentUser?.uid]);

  // Enter selection mode on long press
  const enterSelectionMode = (memberId) => {
    setSelectionMode(true);
    setSelectedMemberIds([memberId]);
  };

  // Toggle selection for a member
  const toggleSelection = (memberId) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMemberIds([]);
  };

  // Selection computations
  const numSelected = selectedMemberIds.length;
  const nonAdminSelected = selectedMemberIds.filter(id => !isUserAdmin(id)).length;
  const adminSelected = numSelected - nonAdminSelected;
  const numDemotable = selectedMemberIds.filter(id => isUserAdmin(id) && localGroup?.createdBy !== id).length;
  const removableSelected = selectedMemberIds.filter(id => 
    id !== currentUser?.uid && id !== localGroup?.createdBy
  ).length;
  const showMakeAdmin = nonAdminSelected > 0;
  const showRemoveAdmin = !showMakeAdmin && numDemotable > 0;
  const showRemoveMember = removableSelected > 0;
  const actionText = showMakeAdmin ? 'Promote' : showRemoveAdmin ? 'Demote' : '';

  // Batch make admins
  const handleMakeAdmins = async () => {
    if (!isAdmin || !localGroup?.id || selectedMemberIds.length === 0) return;

    const promotableIds = selectedMemberIds.filter(id => !isUserAdmin(id));
    if (promotableIds.length === 0) {
      exitSelectionMode();
      return;
    }

    setLoading(true);
    try {
      for (const userId of promotableIds) {
        await groupService.makeAdmin(localGroup.id, userId);
      }
      console.log(`✅ ${promotableIds.length} users promoted to admin`);
    } catch (error) {
      console.error('Error making users admin:', error);
      window.alert('Failed to make users admin');
    } finally {
      setLoading(false);
      exitSelectionMode();
    }
  };

  // Batch remove admin privileges
  const handleRemoveAdmins = async () => {
    if (!isAdmin || !localGroup?.id || selectedMemberIds.length === 0) return;

    const demotableIds = selectedMemberIds.filter(id => 
      isUserAdmin(id) && localGroup.created_by !== id
    );

    if (demotableIds.length === 0) {
      window.alert('Cannot remove admin privileges from the group creator.');
      exitSelectionMode();
      return;
    }

    setLoading(true);
    try {
      for (const userId of demotableIds) {
        await groupService.removeAdmin(localGroup.id, userId);
      }
      console.log(`✅ Admin privileges removed from ${demotableIds.length} users`);
    } catch (error) {
      console.error('Error removing admin privileges:', error);
      window.alert('Failed to remove admin privileges');
    } finally {
      setLoading(false);
      exitSelectionMode();
    }
  };

  // Batch remove members
  const handleRemoveMembers = async () => {
    if (!isAdmin || !localGroup?.id || selectedMemberIds.length === 0) return;

    // Filter out current user and creator
    const removableMembers = selectedMemberIds.filter(id => 
      id !== currentUser?.id && id !== localGroup.created_by
    );

    if (removableMembers.length === 0) {
      window.alert('Cannot remove yourself or the group creator.');
      return;
    }

    if (!window.confirm(`Remove ${removableMembers.length} member(s) from the group?`)) return;

    setLoading(true);
    try {
      for (const userId of removableMembers) {
        await groupService.removeMember(localGroup.id, userId);
      }
      console.log(`✅ ${removableMembers.length} members removed from group`);
    } catch (error) {
      console.error('Error removing members:', error);
      window.alert('Failed to remove members');
    } finally {
      setLoading(false);
      exitSelectionMode();
    }
  };

  // Update group description
  const handleSaveDescription = async () => {
    if (!isAdmin || !localGroup?.id) return;

    setLoading(true);
    try {
      await groupService.updateGroup(localGroup.id, {
        description: description.trim()
      });
      
      setIsEditingDescription(false);
      // localGroup will be updated via subscription
      console.log('✅ Group description updated');
    } catch (error) {
      console.error('Error updating description:', error);
      window.alert('Failed to update description');
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
    <div className="group-infoChatmeGroups-modal-overlay" onClick={onClose}>
      <div className="group-infoChatmeGroups-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-infoChatmeGroups-header">
          <h2>Group Info</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="group-infoChatmeGroups-content">
          {/* Left Column - Group Details */}
          <div className="group-infoChatmeGroups-left">
            {/* Group Image */}
            <div className="group-infoChatmeGroups-image-section" style={{ position: 'relative' }}>
              {localGroup?.icon ? (
                <img 
                  src={localGroup.icon} 
                  alt={localGroup.name} 
                  className="group-infoChatmeGroups-image" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.group-infoChatmeGroups-image-placeholder')) {
                      const div = document.createElement('div');
                      div.className = 'group-infoChatmeGroups-image-placeholder';
                      const span = document.createElement('span');
                      span.textContent = (localGroup?.name || 'G').charAt(0).toUpperCase();
                      div.appendChild(span);
                      parent.appendChild(div);
                    }
                  }}
                />
              ) : (
                <div className="group-infoChatmeGroups-image-placeholder">
                  <span>{localGroup?.name?.charAt(0)?.toUpperCase() || 'G'}</span>
                </div>
              )}
              {/* Kebab menu button (top-right of image area) */}
              <button
                className="group-kebabChatmeGroups-btn"
                style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowKebab(prev => !prev)}
                aria-label="More options"
              >
                <FiMoreVertical size={20} />
              </button>
              {showKebab && (
                <div
                  className="group-kebabChatmeGroups-menu"
                  style={{ position: 'absolute', top: 36, right: 8, background: '#080808ff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', zIndex: 5, minWidth: 220 }}
                  onMouseLeave={() => setShowSettingsSubmenu(false)}
                >
                  <div className="menu-item" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', opacity: isAdmin ? 1 : 0.5 }}
                    onMouseEnter={() => isAdmin && setShowSettingsSubmenu(true)}
                    onClick={() => isAdmin && setShowSettingsSubmenu(prev => !prev)}
                    title={isAdmin ? 'Group Settings' : 'Admins only'}
                  >
                    <span>Group Settings</span>
                    <FiChevronRight size={16} />
                  </div>
                  {isAdmin && showSettingsSubmenu && (
                    <div className="submenu" style={{ position: 'absolute', top: 0, right: '100%', background: '#080808ff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', minWidth: 260 }}>
                      <div className="submenu-item" style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={handleToggleSendRestriction}>
                        {localGroup?.onlyAdminsCanSend ? 'Allow all members to send messages' : 'Only admins can send messages'}
                      </div>
                      <div className="submenu-item disabled" style={{ padding: '10px 12px', opacity: 0.6 }}>
                        Member approvals (coming soon)
                      </div>
                    </div>
                  )}
                  <div className="menu-item" style={{ padding: '10px 12px', cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.5 }}
                    onClick={() => { if (isAdmin) { setProfileName(localGroup?.name || ''); setProfileIcon(localGroup?.icon || ''); setShowProfileDialog(true); setShowKebab(false); } }}
                    title={isAdmin ? 'Change Profile' : 'Admins only'}
                  >
                    Change Profile
                  </div>
                  <div className="menu-item" style={{ padding: '10px 12px', cursor: 'default', opacity: 0.8 }}>
                    More (coming soon)
                  </div>
                </div>
              )}
              <h3 className="group-nameChatmeGroups">{localGroup?.name || 'Group Chat'}</h3>
              <p className="group-membersChatmeGroups-count">{members.length} members</p>
            </div>

            {/* Description Section */}
            <div className="group-infoChatmeGroups-section">
              <div className="section-header">
                <h4>Description</h4>
                {isAdmin && !isEditingDescription && (
                  <button 
                    className="edit-btn"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              
              {isEditingDescription ? (
                <div className="edit-description">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add group description..."
                    maxLength={500}
                    rows={4}
                  />
                  <div className="edit-description-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setDescription(localGroup?.description || '');
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={handleSaveDescription}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="group-descriptionChatmeGroups">
                  {localGroup?.description || 'No description'}
                </p>
              )}
            </div>

            {/* Group Created Info */}
            <div className="group-infoChatmeGroups-footer">
              <p className="group-createdChatmeGroups-info">
                Created {localGroup?.createdAt ? (
                  typeof localGroup.createdAt.toDate === 'function' 
                    ? new Date(localGroup.createdAt.toDate()).toLocaleDateString()
                    : new Date(localGroup.createdAt).toLocaleDateString()
                ) : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Right Column - Members */}
          <div className="group-infoChatmeGroups-right">
            <div className="group-infoChatmeGroups-section">
              <div className="section-header">
                <h4>
                  {selectionMode 
                    ? `${numSelected} selected${actionText ? ` • ${actionText}` : ''}` 
                    : `Members (${members.length})`
                  }
                </h4>
                {isAdmin && (
                  <>
                    {selectionMode ? (
                      <div className="selection-actions">
                        {showMakeAdmin && (
                          <button 
                            className="selection-btn"
                            onClick={handleMakeAdmins}
                            disabled={loading}
                          >
                            Make Admin
                          </button>
                        )}
                        {showRemoveAdmin && (
                          <button 
                            className="selection-btn"
                            onClick={handleRemoveAdmins}
                            disabled={loading}
                          >
                            Remove Admin
                          </button>
                        )}
                        {showRemoveMember && (
                          <button 
                            className="selection-btn danger"
                            onClick={handleRemoveMembers}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                        <button 
                          className="selection-btn cancel"
                          onClick={exitSelectionMode}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="add-member-btn"
                        onClick={() => setShowAddMemberModal(true)}
                      >
                        <FiUserPlus size={16} />
                        Add
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="members-list">
                {members.map((member) => (
                  <GroupMemberItem
                    key={member?.uid}
                    member={member}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    isGroupCreator={isGroupCreator}
                    isUserAdmin={isUserAdmin}
                    getAvatarColor={getAvatarColor}
                    selectionMode={selectionMode}
                    selectedMemberIds={selectedMemberIds}
                    onLongPress={() => enterSelectionMode(member.uid)}
                    onToggleSelection={() => toggleSelection(member.uid)}
                    loading={loading}
                    onOpenProfile={(uid, name) => {
                      // Close modal first, then bubble up to parent to open ProfileViewer
                      try { onClose && onClose(); } catch(e){}
                      if (typeof onOpenProfile === 'function') onOpenProfile(uid, name);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddMemberModal && isAdmin && (
        <AddMembersModal
          group={localGroup}
          onClose={() => setShowAddMemberModal(false)}
          onMembersAdded={(newMembers) => {
            // localGroup and members will be updated via onSnapshot and useEffect
            if (onGroupUpdate) {
              onGroupUpdate(localGroup);
            }
          }}
        />
      )}
    </div>
  );
};