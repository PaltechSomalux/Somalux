import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FiMessageSquare,
  FiUserPlus,
  FiUsers,
  FiX,
  FiSearch,
  FiPlus,
  FiLink,
  FiUser,
  FiTrash2,
  FiLock,
  FiFolder,
} from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';
import { useChatLock } from './utils/ChatLockProvider';
import { fetchSuggestedUsersV2 } from './utils/smartSuggestions';
import './FloatingActionButton.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Chat Service using Supabase
class SupabaseChatService {
  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
      return null;
    }
    return data || null;
  }

  async createOrUpdateUser(userId, userData) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userData.email,
        name: userData.name,
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
    return data;
  }

  async getOrCreateChat(userId, contactUid) {
    // Sort user IDs for consistent ordering (required by schema)
    const [sortedUser1, sortedUser2] = [userId, contactUid].sort();
    
    const { data: existingChat, error: selectError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', sortedUser1)
      .eq('user2_id', sortedUser2)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking chat:', selectError);
      throw selectError;
    }

    if (existingChat) {
      return existingChat;
    }

    const { data: newChat, error: insertError } = await supabase
      .from('conversations')
      .insert([{
        user1_id: sortedUser1,
        user2_id: sortedUser2,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating chat:', insertError);
      throw insertError;
    }

    return newChat;
  }

  async updateUserChatSettings(userId, chatId, settings) {
    const { error } = await supabase
      .from('user_chats')
      .upsert({
        user_id: userId,
        chat_id: chatId,
        is_pinned: settings.is_pinned || false,
        is_archived: settings.is_archived || false,
        is_muted: settings.is_muted || false,
        is_locked: settings.is_locked || false,
        is_deleted: settings.is_deleted || false,
      }, { onConflict: 'user_id,chat_id' });

    if (error) {
      console.error('Error updating chat settings:', error);
      throw error;
    }
  }

  async saveUserPin(userId, pin) {
    const { error } = await supabase
      .from('users')
      .update({ pin: pin })
      .eq('id', userId);

    if (error) {
      console.error('Error saving PIN:', error);
      throw error;
    }
  }
}

const supabaseChatService = new SupabaseChatService();

/**FloatingActionButton component for initiating new chats, contacts, and PIN management.
Includes smart user suggestions and contact import functionality.
 */
export const FloatingActionButton = ({
  contacts,
  onNewChat,
  onNewContact,
  onDeleteContact,
  onCreateGroup,
  onCreateFolder,
  isChatSelected,
  currentUser,
}) => {
  const { pinExists, showToast } = useChatLock();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactError, setContactError] = useState(null);
  const [pinError, setPinError] = useState(null);

  const [isContactApiSupported, setIsContactApiSupported] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [pinData, setPinData] = useState({
    pin: '',
    confirmPin: '',
  });
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [addedContactUids, setAddedContactUids] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allUsersAdded, setAllUsersAdded] = useState(false);
  const [imgErrors, setImgErrors] = useState({}); // Per-user image error states

  // Set Contact API support
  useEffect(() => {
    setIsContactApiSupported('contacts' in navigator && 'ContactsManager' in window);
    // console.log('FAB: Contact API supported:', 'contacts' in navigator && 'ContactsManager' in window);
  }, []);

  // log: Log current user and set up real-time listener for added contacts
  useEffect(() => {
    // console.log('FAB: Current user data:', {
    //   uid: currentUser?.uid,
    //   name: currentUser?.name,
    //   email: currentUser?.email,
    //   phone: currentUser?.phone,
    // });
    if (!currentUser?.uid) {
      // console.log('FAB: No current user, resetting state');
      setAddedContactUids([]);
      setSuggestedUsers([]);
      setAllUsersAdded(false);
      return;
    }

    const userChatsQuery = query(collection(db, 'userChats', currentUser.uid, 'chats'));
    const unsubscribe = onSnapshot(userChatsQuery, (snapshot) => {
      try {
        const uids = snapshot.docs
          .filter(doc => !doc.data().isDeleted)
          .map(doc => doc.id);
        // console.log('FAB: Real-time added contact UIDs:', uids);
        setAddedContactUids(uids);
      } catch (error) {
        console.error('FAB: Error in real-time contacts snapshot:', error);
        setAddedContactUids([]);
        setContactError('Failed to load contacts.');
      }
    }, (error) => {
      console.error('FAB: Snapshot error for userChats:', error);
      setAddedContactUids([]);
      setContactError('Failed to load contacts in real-time.');
    });

    return () => {
      // console.log('FAB: Cleaning up userChats snapshot listener');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // log: Search users in Supabase profiles table (search by email or display_name)
  useEffect(() => {
    if (!currentUser?.uid || !searchQuery) {
      // console.log('FAB: No search query or current user, clearing search results');
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        console.log('FAB: Searching users with query:', searchQuery);
        
        // Search in Supabase profiles table by email or display_name
        const { data: usersData, error } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url')
          .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) {
          console.error('FAB: Error searching Supabase profiles:', error);
          setSearchResults([]);
          return;
        }

        let results = (usersData || []).map((data) => ({
          id: data.id,
          uid: data.id,
          name: data.display_name || data.email?.split('@')[0] || 'Unknown',
          email: data.email || 'No email',
          phone: '',
          photoURL: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.display_name || data.email?.split('@')[0] || 'Unknown')}`,
          isOnline: false,
          lastSeen: new Date(),
        }));
        
        // Removed filter to include added users in search results
        console.log('FAB: Search results (unfiltered):', results.map(u => ({
          uid: u.uid,
          name: u.name,
          email: u.email,
          isAdded: addedContactUids.includes(u.uid),
          isCurrentUser: u.uid === currentUser.uid,
        })));
        setSearchResults(results);
      } catch (error) {
        console.error('FAB: Error searching users:', error);
        setSearchResults([]);
        setContactError('Failed to search users.');
      }
    };

    searchUsers();
  }, [searchQuery, currentUser?.uid, addedContactUids]);

  const toggleMenu = () => {
    console.log('FAB: Toggling menu, isOpen:', !isOpen);
    setIsOpen(!isOpen);
  };

  const handleNewChatClick = () => {
    if (!currentUser?.uid) {
      // console.log('FAB: No current user, cannot open new chat modal');
      setContactError('Please sign in to start a new chat.');
      return;
    }
    console.log('FAB: Opening new chat modal');
    setShowNewChatModal(true);
    setIsOpen(false);
    setIsLoading(true);
    // Fetch suggestions only when opening the modal
    fetchSuggestedUsersV2(currentUser, addedContactUids, setSuggestedUsers, setAllUsersAdded, setIsLoading);
  };

  const handleNewContactClick = () => {
    if (!currentUser?.uid) {
      // console.log('FAB: No current user, cannot open new contact modal');
      setContactError('Please sign in to add a new contact.');
      return;
    }
    console.log('FAB: Opening new contact modal');
    setShowContactModal(true);
    setIsOpen(false);
  };

  const handlePinClick = () => {
    if (!currentUser?.uid) {
      // console.log('FAB: No current user, cannot open PIN modal');
      setPinError('Please sign in to set or change PIN.');
      return;
    }
    console.log('FAB: Opening PIN modal');
    setShowPinModal(true);
    setIsOpen(false);
  };

  const closeModal = () => {
    console.log('FAB: Closing modal');
    setShowNewChatModal(false);
    setShowContactModal(false);
    setShowPinModal(false);
    setContactError(null);
    setPinError(null);
    setNewContact({ name: '', phone: '', email: '' });
    setPinData({ pin: '', confirmPin: '' });
    setSearchQuery('');
    setSearchResults([]);
    setSuggestedUsers([]);
    setAllUsersAdded(false);
    setIsLoading(false);
  };

  const handleSearch = (e) => {
    console.log('FAB: Search query updated:', e.target.value);
    setSearchQuery(e.target.value);
  };

  const getPhoneContacts = async () => {
    if (!isContactApiSupported) {
      console.log('FAB: Contact API not supported');
      setContactError('Contact API not supported in this browser.');
      return;
    }
    try {
      console.log('FAB: Fetching device contacts');
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const deviceContacts = await navigator.contacts.select(props, opts);
      const formattedContacts = deviceContacts.map((contact) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: contact.name?.[0] || '',
        phone: contact.tel?.[0] || '',
        email: contact.email?.[0] || '',
        isManual: false,
      }));
      console.log('FAB: Device contacts fetched:', formattedContacts);
      formattedContacts.forEach((contact) => {
        if (contact.phone && !contacts.some((c) => c.phone === contact.phone)) {
          console.log('FAB: Importing contact:', contact);
          onNewContact(contact);
          onNewChat(contact);
        }
      });
      setContactError(null);
    } catch (error) {
      console.error('FAB: Error accessing contacts:', error);
      setContactError('Failed to access contacts. Please ensure you have granted permission.');
    }
  };

  const handleManualContactChange = (e) => {
    const { name, value } = e.target;
    console.log('FAB: Manual contact field changed:', { [name]: value });
    setNewContact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePinChange = (e) => {
    const { name, value } = e.target;
    console.log('FAB: PIN field changed:', { [name]: value });
    setPinData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePhoneNumber = (phone) => {
    return /^\+?[\d\s-]{6,}$/.test(phone);
  };

  const validatePin = (pin) => {
    return /^\d{4}$/.test(pin); // Example: 4-digit numeric PIN
  };

  const saveManualContact = () => {
    console.log('FAB: Attempting to save manual contact:', newContact);
    if (!newContact.name) {
      console.log('FAB: Validation failed: Name is required');
      setContactError('Name is required');
      return;
    }
    if (!newContact.phone) {
      console.log('FAB: Validation failed: Phone number is required');
      setContactError('Phone number is required');
      return;
    }
    if (!validatePhoneNumber(newContact.phone)) {
      console.log('FAB: Validation failed: Invalid phone number');
      setContactError('Please enter a valid phone number');
      return;
    }
    const contact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email,
      isManual: true,
    };
    const existingContact = contacts.find((c) => c.phone === contact.phone);
    if (existingContact) {
      console.log('FAB: Existing contact found, starting chat:', existingContact);
      onNewChat(existingContact);
      closeModal();
      return;
    }
    console.log('FAB: Saving new contact and starting chat:', contact);
    onNewContact(contact);
    onNewChat(contact);
    setNewContact({ name: '', phone: '', email: '' });
    setContactError(null);
    closeModal();
  };

  const savePin = async () => {
    console.log('FAB: Attempting to save PIN:', {
      pin: pinData.pin,
      confirmPin: pinData.confirmPin,
      userUid: currentUser.uid,
    });

    if (!pinData.pin) {
      console.log('FAB: Validation failed: PIN is required');
      setPinError('PIN is required');
      return;
    }
    if (!validatePin(pinData.pin)) {
      console.log('FAB: Validation failed: Invalid PIN format');
      setPinError('PIN must be a 4-digit number');
      return;
    }
    if (pinData.pin !== pinData.confirmPin) {
      console.log('FAB: Validation failed: PINs do not match');
      setPinError('PINs do not match');
      return;
    }

    try {
      console.log('FAB: Saving PIN to Supabase for user:', currentUser.uid);
      await supabaseChatService.saveUserPin(currentUser.uid, pinData.pin);
      console.log('FAB: PIN saved successfully for user:', {
        uid: currentUser.uid,
        pinExistsBefore: pinExists,
      });
      showToast(pinExists ? 'PIN changed successfully!' : 'PIN set successfully!', 'success');
      setPinError(null);
      closeModal();
    } catch (error) {
      console.error('FAB: Error saving PIN:', {
        error: error.message,
        uid: currentUser.uid,
      });
      setPinError('Failed to save PIN. Please try again.');
    }
  };

  const addUserToChatList = async (user) => {
    console.log('FAB: Attempting to add user to chat list:', user);
    if (!currentUser?.uid) {
      console.error('FAB: Cannot add user: missing currentUser.uid');
      setContactError('Cannot add user: authentication required.');
      return;
    }
    if (!user?.uid) {
      console.error('FAB: Cannot add user: invalid user', { user });
      setContactError('Invalid user selected.');
      return;
    }

    // Check if user already added
    if (addedContactUids.includes(user.uid)) {
      console.log('FAB: User already added, starting chat directly:', user);
      let contactId = user.uid;
      let contactName = user.name || user.displayName || 'Unknown';
      if (user.uid === currentUser.uid) {
        contactName = 'You';
      }
      onNewChat({
        id: contactId,
        uid: user.uid,
        name: contactName,
        email: user.email || 'No email',
        phone: user.phone || '',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}`,
        isOnline: user.isOnline || false,
      });
      closeModal();
      return;
    }

    // Check if user already exists in users table; if not, create it
    const existingUser = await supabaseChatService.getUser(user.uid);
    if (!existingUser) {
      console.warn('FAB: User does not exist in users collection, creating new user:', user.uid);
      await supabaseChatService.createOrUpdateUser(user.uid, {
        email: user.email,
        name: user.name,
      });
    }

    try {
      // Create or get chat using service
      const chatResult = await supabaseChatService.getOrCreateChat(currentUser.uid, user.uid);
      const chatId = chatResult?.id;
      
      if (!chatId) {
        throw new Error('Failed to create or get chat: no chat ID returned');
      }
      
      // Update user chat settings
      await supabaseChatService.updateUserChatSettings(currentUser.uid, chatId, {
        is_pinned: false,
        is_archived: false,
        is_muted: false,
        is_locked: false,
        is_deleted: false,
      });
      
      console.log('FAB: Successfully added user to chat list:', user);
      let contactId = user.uid;
      let contactName = user.name || user.displayName || 'Unknown';
      if (user.uid === currentUser.uid) {
        contactName = 'You';
      }
      
      // Pass the conversation ID to onNewChat so handleNewChat can find it
      onNewChat({
        id: chatId, // Pass conversation ID, not user ID
        uid: user.uid,
        conversationId: chatId,
        name: contactName,
        email: user.email || 'No email',
        phone: user.phone || '',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}`,
        isOnline: user.isOnline || false,
      });
      closeModal();
    } catch (error) {
      console.error('FAB: Error adding user to chat list:', error);
      setContactError(`Failed to add user to chat list: ${error.message}`);
    }
  };

  const handleImageError = (uid) => {
    setImgErrors(prev => ({ ...prev, [uid]: true }));
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Skeleton component for loading state
  const SkeletonContactItem = () => (
    <div className="contact-item skeleton">
      <div className="contact-avatar skeleton-avatar"></div>
      <div className="contact-info">
        <div className="skeleton-text skeleton-name"></div>
        <div className="skeleton-text skeleton-email"></div>
      </div>
      <div className="contact-actions">
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  if (!currentUser?.uid) {
    console.log('FAB: Not rendering: no current user');
    return null;
  }

  return (
    <>
      <div className="fab-container">
        {isOpen && (
          <div className="fab-menu">
            <button className="fab-menu-item" onClick={() => {
              setIsOpen(false);
              if (onCreateFolder) {
                onCreateFolder();
              }
            }}>
              <span className="fab-icon">
                <FiFolder />
              </span>
              <span className="fab-label">New folder</span>
            </button>
            <button className="fab-menu-item" onClick={handlePinClick}>
              <span className="fab-icon">
                <FiLock />
              </span>
              <span className="fab-label">{pinExists ? 'Change PIN' : 'Set PIN'}</span>
            </button>
            <button className="fab-menu-item" onClick={() => {
              setIsOpen(false);
              if (onCreateGroup) {
                onCreateGroup();
              } else {
                alert('Group creation not available');
              }
            }}>
              <span className="fab-icon">
                <FiUsers />
              </span>
              <span className="fab-label">New group</span>
            </button>
            <button className="fab-menu-item" onClick={() => alert('Link device functionality would go here')}>
              <span className="fab-icon">
                <FiLink />
              </span>
              <span className="fab-label">Link device</span>
            </button>
            <button className="fab-menu-item" onClick={handleNewChatClick}>
              <span className="fab-icon">
                <FiMessageSquare />
              </span>
              <span className="fab-label">New chats</span>
            </button>
          </div>
        )}
        <button
          className={`fab-main ${isOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Create new"
        >
          {isOpen ? <FiX /> :  '+' }
        </button>
      </div>

      {showNewChatModal && (
        <div className="fab-modal-overlay" onClick={closeModal}>
          <div
            className="fab-modal"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fab-modal-header">
              <div className="header-search-container">
                <h3 style={{ fontSize: '0.9rem', margin: '0' }}>New Chats</h3>
                {contactError && (
                  <div className="contact-error">
                    {contactError}
                  </div>
                )}
                <div className="fab-modal-search">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Find Readers"
                    value={searchQuery}
                    onChange={handleSearch}
                    disabled={isLoading}
                    style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                  />
                </div>
              </div>
              <button className="fab-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="fab-modal-content">
              {/* // Replace the isLoading conditional block in the fab-modal-content with this: */}

              {isLoading ? (
                <div className="fab-contact-list">
                  <h5>Suggestions</h5>
                  <SkeletonContactItem />
                  <SkeletonContactItem />
                  <SkeletonContactItem />
                  <div className="loading-indicator">
                    <div className="loading-text">Loading readers...</div>
                    <div className="loading-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fab-contact-list">
                  {searchQuery ? (
                    searchResults.length > 0 ? (
                      searchResults.map((user) => {
                        const isCurrentUser = user.uid === currentUser.uid;
                        const isAdded = addedContactUids.includes(user.uid);
                        const hasImageError = imgErrors[user.uid];
                        return (
                          <div key={user.uid} className="contact-item">
                            <div className="contact-avatar">
                              {user.photoURL && !hasImageError ? (
                                <img
                                  src={user.photoURL}
                                  alt={`${user.name || 'User'}'s profile photo`}
                                  onError={() => handleImageError(user.uid)}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: getRandomColor(),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                  }}
                                >
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div className="contact-info">
                              <h4>
                                {user.name || 'No name'}
                                {isCurrentUser && ' (You)'}
                              </h4>
                              {isAdded && <div className="added-banner" style={{ fontSize: '0.8em', color: '#888', marginTop: '4px' }}>Added</div>}
                            </div>
                            <div className="contact-actions">
                              <button
                                className={`add-contact-btn ${isAdded ? 'added-btn' : ''}`}
                                onClick={!isAdded ? () => addUserToChatList(user) : undefined}
                                disabled={isAdded}
                                title={isCurrentUser ? 'Start chat with yourself' : (isAdded ? 'Already added' : 'Add to chat')}
                                style={isAdded ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                              >
                                {isAdded ? 'Added' : 'Add'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <FiUser className="empty-icon" />
                        <p>No readers found</p>
                      </div>
                    )
                  ) : allUsersAdded ? (
                    <div className="empty-state">
                      <FiUser className="empty-icon" />
                      <p>You've added all available readers</p>
                    </div>
                  ) : suggestedUsers.length > 0 ? (
                    <>
                      <h5>Suggestions</h5>
                      {suggestedUsers.map((user) => {
                        const isCurrentUser = user.uid === currentUser.uid;
                        const isAdded = addedContactUids.includes(user.uid);
                        const hasImageError = imgErrors[user.uid];
                        return (
                          <div key={user.uid} className="contact-item">
                            <div className="contact-avatar">
                              {user.photoURL && !hasImageError ? (
                                <img
                                  src={user.photoURL}
                                  alt={`${user.name || 'User'}'s profile photo`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                  onError={() => handleImageError(user.uid)}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: getRandomColor(),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                  }}
                                >
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div className="contact-info">
                              <h4>
                                {user.name || 'No name'}
                                {isCurrentUser && ' (You)'}
                              </h4>
                              {isAdded && <div className="added-banner" style={{ fontSize: '0.8em', color: '#888', marginTop: '4px' }}>Added</div>}
                            </div>
                            <div className="contact-actions">
                              <button
                                className={`add-contact-btn ${isAdded ? 'added-btn' : ''}`}
                                onClick={!isAdded ? () => addUserToChatList(user) : undefined}
                                disabled={isAdded}
                                title={isCurrentUser ? 'Start chat with yourself' : (isAdded ? 'Already added' : 'Add to chat')}
                                style={isAdded ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                              >
                                {isAdded ? 'Added' : 'Add'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {suggestedUsers.length < 3 && (
                        <p className="hint-text">
                          {suggestedUsers.length}  user{suggestedUsers.length !== 1 ? 's' : ''} available
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <FiUser className="empty-icon" />
                      <p>No suggested readers available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fab-modal-overlay">
          <div className="fab-modal">
            <div className="fab-modal-header">
              <h3>New Contact</h3>
              {contactError && (
                <div className="contact-error">
                  {contactError}
                </div>
              )}
              <button className="fab-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="fab-modal-content">
              <div className="contact-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={newContact.name}
                  onChange={handleManualContactChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={newContact.phone}
                  onChange={handleManualContactChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email (optional)"
                  value={newContact.email}
                  onChange={handleManualContactChange}
                />
                <button className="save-contact-btn" onClick={saveManualContact}>
                  Save & Chat
                </button>
                {isContactApiSupported && (
                  <button className="import-contacts-btn" onClick={getPhoneContacts}>
                    Import from device
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fab-pin-dialog-overlay" onClick={closeModal}>
          <div className="fab-pin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fab-pin-header">
              <h4>{pinExists ? 'Change PIN' : 'Set PIN'}</h4>
              <button className="close-btn" onClick={closeModal} aria-label="Close">×</button>
            </div>
            {pinError && (
              <div className="pin-error">
                {pinError}
              </div>
            )}
            <div className="pin-inputs">
              <input
                type="password"
                name="pin"
                placeholder="Enter 4-digit PIN"
                value={pinData.pin}
                onChange={handlePinChange}
                maxLength="4"
                required
                autoFocus
              />
              <input
                type="password"
                name="confirmPin"
                placeholder="Confirm 4-digit PIN"
                value={pinData.confirmPin}
                onChange={handlePinChange}
                maxLength="4"
                required
              />
            </div>
            <button className="pin-save-btn" onClick={savePin}>
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
};

FloatingActionButton.propTypes = {

  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      phone: PropTypes.string,
      email: PropTypes.string,
      isManual: PropTypes.bool,
    })
  ).isRequired,
  onNewChat: PropTypes.func.isRequired,
  onNewContact: PropTypes.func.isRequired,
  onDeleteContact: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func,
  onCreateGroup: PropTypes.func,
  isChatSelected: PropTypes.bool.isRequired,
  currentUser: PropTypes.shape({
    uid: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
  }),
};

FloatingActionButton.defaultProps = {
  currentUser: null,
};

export default FloatingActionButton;