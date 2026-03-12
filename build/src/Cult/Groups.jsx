import React, { useState, useEffect, useMemo } from 'react'; // Fixed: Added useMemo
import { 
  FiArrowLeft,
  FiUsers,
  FiSearch,
  FiMoreVertical,
  FiVideo,
  FiPhone
} from 'react-icons/fi';
import { ChatScreen } from './ChatScreen';
import { auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import "./Groups.css";
   
export const Groups = ({ initialGroup, onBackClick, isMobileView, onMessageCreated }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [callStatus, setCallStatus] = useState(null);
  const [messages, setMessages] = useState(initialGroup?.messages || []);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showForwardMenu, setShowForwardMenu] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const currentUser = auth.currentUser;

  // Fetch real group members from Firestore
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!initialGroup?.memberIds || !currentUser) {
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const membersQuery = query(
          collection(db, 'users'),
          where('uid', 'in', initialGroup.memberIds)
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        const members = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.uid,
            name: data.displayName || data.name || data.email?.split('@')[0] || 'Unknown User',
            email: data.email,
            photoURL: data.photoURL,
            online: data.online || false,
            lastSeen: data.lastSeen || null
          };
        });

        setGroupMembers(members);
        console.log('📋 Fetched real group members:', members);
      } catch (error) {
        console.error('Error fetching group members:', error);
        setGroupMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchGroupMembers();
  }, [initialGroup?.memberIds, currentUser]);

  // Transform initialGroup to match GroupHeader/ChatScreen structure
  const transformedGroup = useMemo(() => {
    if (!initialGroup) return null;

    return {
      ...initialGroup,
      // Ensure required fields for GroupHeader
      memberCount: groupMembers.filter(m => m.online).length,
      totalMembers: initialGroup.participants || groupMembers.length,
      lastActivity: initialGroup.lastActivity || new Date().toISOString(),
      members: groupMembers, // Use real members data
      avatar: initialGroup.groupPicture // Map groupPicture to avatar
    };
  }, [initialGroup, groupMembers]);

  useEffect(() => {
    if (transformedGroup) {
      setMessages(transformedGroup.messages || []);
    }
  }, [transformedGroup]);

  const handleSendMessage = (messageText) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: currentUser?.uid,
      senderName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'You',
      text: messageText,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, newMessage]);
    if (onMessageCreated) {
      onMessageCreated(newMessage);
    }
  };

  const startCall = (isVideo) => {
    setCallStatus(isVideo ? 'video' : 'audio');
  };

  const handleBackClick = () => {
    if (showGroupInfo) {
      setShowGroupInfo(false);
    } else {
      onBackClick();
    }
  };

  if (!transformedGroup) {
    return (
      <div className="groups-container">
        <div className="empty-state">
          <p>No group selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="groups-container">
      {isMobileView && !showGroupInfo && (
        <div className="mobile-group-header">
          <button onClick={handleBackClick} className="back-button">
            <FiArrowLeft />
          </button>
          <div className="group-title">{transformedGroup.name}</div>
        </div>
      )}
      
      <div className="group-main-content">
        <ChatScreen 
          key={transformedGroup.id}
          group={transformedGroup} // Updated: Pass full group object
          startCall={startCall}
          setShowContactPicker={setShowContactPicker}
          setForwardMessage={setForwardMessage}
          setShowForwardMenu={setShowForwardMenu}
          onBackClick={handleBackClick}
        />
      </div>

      {showGroupInfo && (
        <div className="group-info-sidebar">
          <div className="group-info-header">
            <button onClick={() => setShowGroupInfo(false)} className="back-button">
              <FiArrowLeft />
            </button>
            <div className="group-info-title">
              <h3>Group Info</h3>
            </div>
          </div>
          <div className="group-info-content">
            <div className="group-image-large">
              {transformedGroup.avatar || transformedGroup.groupPicture ? (
                <img 
                  src={transformedGroup.avatar || transformedGroup.groupPicture} 
                  alt={transformedGroup.name}
                  onError={(e) => {
                    // Fallback to colored initial block
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.group-image-fallback')) {
                      const div = document.createElement('div');
                      div.className = 'group-image-fallback';
                      div.textContent = (transformedGroup.name || 'G').charAt(0).toUpperCase();
                      parent.appendChild(div);
                    }
                  }}
                />
              ) : (
                <div className="group-image-fallback">
                  {(transformedGroup.name || 'G').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2>{transformedGroup.name}</h2>
            <p className="group-meta">
              <FiUsers /> {transformedGroup.totalMembers || transformedGroup.participants} participants
            </p>
            {transformedGroup.description && (
              <p className="group-description">{transformedGroup.description}</p>
            )}
            
            <div className="group-members-section">
              <h4>Participants ({transformedGroup.totalMembers || transformedGroup.participants})</h4>
              <div className="members-list">
                {transformedGroup.members?.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{member.name}</span>
                      {member.online ? (
                        <span className="online-status">
                          <span className="status-dot online"></span>
                          online
                        </span>
                      ) : (
                        <span className="last-seen">
                          <span className="status-dot offline"></span>
                          last seen {member.lastSeen || 'recently'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="group-actions">
              <button className="group-action-btn primary">
                <FiSearch /> Search
              </button>
              <button className="group-action-btn">
                Media, links and docs
              </button>
              <button className="group-action-btn">
                Notifications
              </button>
              <button className="group-action-btn">
                Group settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};