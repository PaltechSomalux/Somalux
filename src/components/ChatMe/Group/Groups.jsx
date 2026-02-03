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
import { supabase, groupService } from '../../../supabase';
import "./GroupsChatmeGroups.css";
   
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
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch real group members from Supabase
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!initialGroup?.id) {
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const members = await groupService.getGroupMembersWithDetails(initialGroup.id);
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
      <div className="groups-containerChatmeGroups">
        <div className="empty-stateChatmeGroups">
          <p>No group selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="groups-containerChatmeGroups">
      {isMobileView && !showGroupInfo && (
        <div className="mobile-group-headerChatmeGroups">
          <button onClick={handleBackClick} className="back-buttonChatmeGroups">
            <FiArrowLeft />
          </button>
          <div className="group-titleChatmeGroups">{transformedGroup.name}</div>
        </div>
      )}
      
      <div className="group-main-contentChatmeGroups">
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
        <div className="group-info-sidebarChatmeGroups">
          <div className="group-info-headerChatmeGroups">
            <button onClick={() => setShowGroupInfo(false)} className="back-buttonChatmeGroups">
              <FiArrowLeft />
            </button>
            <div className="group-info-titleChatmeGroups">
              <h3>Group Info</h3>
            </div>
          </div>
          <div className="group-info-contentChatmeGroups">
            <div className="group-image-largeChatmeGroups">
              {transformedGroup.avatar || transformedGroup.groupPicture ? (
                <img 
                  src={transformedGroup.avatar || transformedGroup.groupPicture} 
                  alt={transformedGroup.name}
                  onError={(e) => {
                    // Fallback to colored initial block
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.group-image-fallbackChatmeGroups')) {
                      const div = document.createElement('div');
                      div.className = 'group-image-fallbackChatmeGroups';
                      div.textContent = (transformedGroup.name || 'G').charAt(0).toUpperCase();
                      parent.appendChild(div);
                    }
                  }}
                />
              ) : (
                <div className="group-image-fallbackChatmeGroups">
                  {(transformedGroup.name || 'G').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2>{transformedGroup.name}</h2>
            <p className="group-metaChatmeGroups">
              <FiUsers /> {transformedGroup.totalMembers || transformedGroup.participants} participants
            </p>
            {transformedGroup.description && (
              <p className="group-descriptionChatmeGroups">{transformedGroup.description}</p>
            )}
            
            <div className="group-members-sectionChatmeGroups">
              <h4>Participants ({transformedGroup.totalMembers || transformedGroup.participants})</h4>
              <div className="members-listChatmeGroups">
                {transformedGroup.members?.map(member => (
                  <div key={member.id} className="member-itemChatmeGroups">
                    <div className="member-avatarChatmeGroups">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-infoChatmeGroups">
                      <span className="member-nameChatmeGroups">{member.name}</span>
                      {member.online ? (
                        <span className="online-statusChatmeGroups">
                          <span className="status-dot onlineChatmeGroups"></span>
                          online
                        </span>
                      ) : (
                        <span className="last-seenChatmeGroups">
                          <span className="status-dot offlineChatmeGroups"></span>
                          last seen {member.lastSeen || 'recently'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="group-actionsChatmeGroups">
              <button className="group-action-btnChatmeGroups primary">
                <FiSearch /> Search
              </button>
              <button className="group-action-btnChatmeGroups">
                Media, links and docs
              </button>
              <button className="group-action-btnChatmeGroups">
                Notifications
              </button>
              <button className="group-action-btnChatmeGroups">
                Group settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};