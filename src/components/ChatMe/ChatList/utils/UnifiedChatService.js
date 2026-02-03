/**
 * UnifiedChatService.js
 * 
 * Ensures consistent chat data fetching across mobile and desktop views.
 * Single source of truth for chat data via Firestore with unified caching.
 * 
 * Key Features:
 * - Unified chat data fetching from Firestore
 * - Consistent caching across views
 * - Real-time listener management
 * - Cache invalidation and refresh
 */


import { supabase } from '../../../../supabase';
import { SupabaseChatService } from '../../services/SupabaseChatService';
import { ChatCache } from './chatCache';

class UnifiedChatServiceClass {
  constructor() {
    this.unsubscribers = new Map(); // userId -> unsubscribe function
    this.listeners = new Map(); // userId -> Set of listener callbacks
    this.chatData = new Map(); // userId -> Array of chats
    this.isInitialized = new Map(); // userId -> boolean
    this.cachedUserDocs = new Map(); // userId -> Map of user data
    this.messageCache = new Map(); // chatId -> latest message
    this.updateDebounceTimers = new Map(); // userId -> timeout ID for debouncing updates
    this.lastUpdateTime = new Map(); // userId -> last update timestamp
    this.apiErrorCount = new Map(); // Track consecutive API failures to decide when to fall back
    this.messageFingerprints = new Map(); // chatId -> hash of last message to detect real changes
  }

  /**
   * Initialize unified chat listener for a user
   * Ensures same data source for both mobile and desktop
   */
  initializeChatListener(currentUser, onChatListUpdate) {
    if (!currentUser?.uid) {
      console.warn('❌ UnifiedChatService: No user provided');
      return () => {};
    }

    const userId = currentUser.uid;
    const cacheKey = ChatCache.KEYS.CHATLIST(userId);

    // If already listening, just register the new callback
    if (this.isInitialized.get(userId)) {
      this.registerListener(userId, onChatListUpdate);
      // Return cached data immediately
      const cached = ChatCache.load(cacheKey);
      if (cached) {
        setTimeout(() => onChatListUpdate(cached), 0);
      }
      return () => this.unregisterListener(userId, onChatListUpdate);
    }

    // Mark as initializing
    this.isInitialized.set(userId, true);
    this.listeners.set(userId, new Set());

    // 1. Load from cache immediately for instant UI
    const cached = ChatCache.load(cacheKey);
    if (cached) {
      console.log(`✅ UnifiedChatService: Loaded ${cached.length} chats from cache`);
      this.chatData.set(userId, cached);
      onChatListUpdate(cached);
    }

    // 2. Register real-time listener for user chats
    const unsubscribe = SupabaseChatService.subscribeToUserChats(
      userId,
      async (chats) => {
        try {
          if (!chats || !Array.isArray(chats)) {
            console.warn('⚠️ UnifiedChatService: Received invalid chats data:', typeof chats, chats);
            this._notifyAllListeners(userId, []);
            return;
          }

          // Light debounce - only process updates once per 300ms for faster responsiveness
          const now = Date.now();
          const lastUpdate = this.lastUpdateTime.get(userId) || 0;
          if (now - lastUpdate < 300) {
            // If we're within the debounce window, queue the update
            const existingTimer = this.updateDebounceTimers.get(userId);
            if (existingTimer) clearTimeout(existingTimer);
            
            const timer = setTimeout(async () => {
              try {
                await this._processChatsUpdate(userId, chats, cacheKey);
              } catch (e) {
                console.error('UnifiedChatService: Error in debounced update:', e?.message);
              }
              this.updateDebounceTimers.delete(userId);
              this.lastUpdateTime.set(userId, Date.now());
            }, 300);
            
            this.updateDebounceTimers.set(userId, timer);
            return;
          }

          await this._processChatsUpdate(userId, chats, cacheKey);
          this.lastUpdateTime.set(userId, now);
        } catch (error) {
          console.error('❌ UnifiedChatService: Error in chat subscription callback:', error?.message || String(error));
          console.error('Stack:', error?.stack);
          this._notifyAllListeners(userId, []);
        }
      }
    );

    // Store unsubscriber for cleanup
    this.unsubscribers.set(userId, unsubscribe);
    this.registerListener(userId, onChatListUpdate);

    // Return cleanup function
    return () => {
      this.unregisterListener(userId, onChatListUpdate);
      // Clear any pending debounce timer
      const timer = this.updateDebounceTimers.get(userId);
      if (timer) clearTimeout(timer);
      this.updateDebounceTimers.delete(userId);
      if (this.listeners.get(userId)?.size === 0) {
        this._cleanup(userId);
      }
    };
  }

  /**
   * Process chats update (extracted from listener for debouncing)
   * @private
   */
  async _processChatsUpdate(userId, chats, cacheKey) {
    // Extract contact UIDs from chats, determining which user ID is the contact
    const contactUids = chats
      .map(chat => {
        // Determine which user is the contact
        return chat.user_id_1 === userId ? chat.user_id_2 : chat.user_id_1;
      })
      .filter(id => id && !chats.find(c => {
        const contact = c.user_id_1 === userId ? c.user_id_2 : c.user_id_1;
        return contact === id && c.is_deleted;
      }));

    // Ensure self-chat exists
    if (!contactUids.includes(userId)) {
      try {
        await SupabaseChatService.getOrCreateChat(userId, userId);
        contactUids.push(userId);
      } catch (e) {
        console.error('UnifiedChatService: Failed to create self-chat:', e);
      }
    }

    // Fetch complete chat data
    const { chatsData, messageFingerprint } = await this._fetchCompleteChatsData(userId, contactUids);
    
    // Check if messages actually changed
    const messagesChanged = this._hasMessagesChanged(userId, messageFingerprint);
    
    // Check if other chat data changed
    const oldData = this.chatData.get(userId);
    const dataChanged = this._hasChatsDataChanged(oldData, chatsData);
    
    // Only notify if something actually changed
    if (dataChanged || messagesChanged) {
      // Cache the data
      ChatCache.save(cacheKey, chatsData);
      
      // Update internal state
      this.chatData.set(userId, chatsData);
      
      // Notify ALL listeners (mobile + desktop)
      this._notifyAllListeners(userId, chatsData);
    }
  }

  /**
   * Create a fingerprint of all message data to detect real changes
   * @private
   */
  _createMessageFingerprint(latestMessagesMap) {
    let fingerprint = '';
    Array.from(latestMessagesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([uid, msg]) => {
        if (msg) {
          // Only include message timestamp and ID, not the whole message
          fingerprint += `${uid}:${msg.id}:${msg.created_at || msg.timestamp || ''}|`;
        }
      });
    return fingerprint;
  }

  /**
   * Check if message data has actually changed
   * @private
   */
  _hasMessagesChanged(userId, newFingerprint) {
    const key = `msg-fp-${userId}`;
    const oldFingerprint = this.messageFingerprints.get(key);
    if (oldFingerprint !== newFingerprint) {
      this.messageFingerprints.set(key, newFingerprint);
      return true;
    }
    return false;
  }
  _hasChatsDataChanged(oldData, newData) {
    if (!oldData || !newData) return true;
    if (oldData.length !== newData.length) return true;
    
    // Do a deep comparison of critical fields
    for (let i = 0; i < Math.min(oldData.length, newData.length); i++) {
      const oldChat = oldData[i];
      const newChat = newData[i];
      
      if (!oldChat || !newChat) return true;
      
      // Only compare fields that would be visible to the user
      if (oldChat.id !== newChat.id) return true;
      if (oldChat.name !== newChat.name) return true;
      if (oldChat.lastMessage !== newChat.lastMessage) return true;
      
      // Compare last message timestamp more robustly
      const oldTimestamp = oldChat.lastMessageTimestamp ? new Date(oldChat.lastMessageTimestamp).getTime() : null;
      const newTimestamp = newChat.lastMessageTimestamp ? new Date(newChat.lastMessageTimestamp).getTime() : null;
      if (oldTimestamp !== newTimestamp) return true;
      
      if (oldChat.isTyping !== newChat.isTyping) return true;
      if (oldChat.unreadCount !== newChat.unreadCount) return true;
      if (oldChat.isPinned !== newChat.isPinned) return true;
      if (oldChat.isOnline !== newChat.isOnline) return true;
    }
    
    return false;
  }

  /**
   * Fetch complete chat data including user info and latest message
   * @private
   */
  async _fetchCompleteChatsData(userId, contactUids) {
    try {
      // Batch fetch user documents (chunked to 10 per query for Firestore limits)
      const userDocsMap = new Map();
      const chunkSize = 10;
      
      for (let i = 0; i < contactUids.length; i += chunkSize) {
        const chunk = contactUids.slice(i, i + chunkSize);
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', chunk);
        
        if (!error && profiles) {
          profiles.forEach(p => {
            userDocsMap.set(p.id, p);
          });
        }
      }

      // Cache user docs for reuse
      this.cachedUserDocs.set(userId, userDocsMap);

      // Ensure current user exists in users table (required for FK constraint)
      try {
        const { data: currentUserExists } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (!currentUserExists) {
          // User doesn't exist in users table, create entry
          const currentUserProfile = userDocsMap.get(userId);
          await supabase
            .from('users')
            .insert([{
              id: userId,
              email: currentUserProfile?.email || '',
              name: currentUserProfile?.full_name || currentUserProfile?.display_name || 'User',
              full_name: currentUserProfile?.full_name || currentUserProfile?.display_name || 'User',
              avatar_url: currentUserProfile?.avatar_url || null,
            }])
            .then(() => {
              console.log(`UnifiedChatService: Created user record for ${userId} in users table`);
            })
            .catch(err => {
              console.warn(`UnifiedChatService: Failed to create user record for ${userId}:`, err);
            });
        }
      } catch (e) {
        console.warn(`UnifiedChatService: Error ensuring current user exists:`, e);
      }

      // Fetch conversation IDs for each contact (auto-create if missing)
      const conversationIdsMap = new Map(); // contactUid -> conversationId
      for (const contactUid of contactUids) {
        try {
          const isSelfChat = contactUid === userId;
          let conversationId;
          
          // Ensure contact user exists in users table (required for FK constraint)
          if (!isSelfChat) {
            try {
              const { data: contactUserExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', contactUid)
                .maybeSingle();
              
              if (!contactUserExists) {
                const contactProfile = userDocsMap.get(contactUid);
                await supabase
                  .from('users')
                  .insert([{
                    id: contactUid,
                    email: contactProfile?.email || '',
                    name: contactProfile?.full_name || contactProfile?.display_name || 'User',
                    full_name: contactProfile?.full_name || contactProfile?.display_name || 'User',
                    avatar_url: contactProfile?.avatar_url || null,
                  }])
                  .catch(err => {
                    console.warn(`UnifiedChatService: Failed to create user record for ${contactUid}:`, err);
                  });
              }
            } catch (e) {
              // User might already exist, continue
            }
          }
          
          if (isSelfChat) {
            // Self-chat: find conversation where both user_ids are the same
            const { data: selfConvo } = await supabase
              .from('conversations')
              .select('id')
              .eq('user1_id', userId)
              .eq('user2_id', userId)
              .maybeSingle();
            conversationId = selfConvo?.id;
            
            // Auto-create if it doesn't exist
            if (!conversationId) {
              const { data: newConvo, error: createError } = await supabase
                .from('conversations')
                .insert([{ user1_id: userId, user2_id: userId }])
                .select('id')
                .single();
              
              if (!createError && newConvo?.id) {
                conversationId = newConvo.id;
                console.log(`UnifiedChatService: Created self-chat conversation ${conversationId}`);
              } else {
                console.warn(`UnifiedChatService: Failed to create self-chat conversation:`, createError);
              }
            }
          } else {
            // Regular chat: find conversation between the two users
            const [user1, user2] = [userId, contactUid].sort();
            const { data: convo } = await supabase
              .from('conversations')
              .select('id')
              .eq('user1_id', user1)
              .eq('user2_id', user2)
              .maybeSingle();
            conversationId = convo?.id;
            
            // Auto-create if it doesn't exist
            if (!conversationId) {
              const { data: newConvo, error: createError } = await supabase
                .from('conversations')
                .insert([{ user1_id: user1, user2_id: user2 }])
                .select('id')
                .single();
              
              if (!createError && newConvo?.id) {
                conversationId = newConvo.id;
                console.log(`UnifiedChatService: Created conversation ${conversationId} for users ${user1}, ${user2}`);
              } else {
                console.warn(`UnifiedChatService: Failed to create conversation:`, createError);
              }
            }
          }
          
          if (conversationId) {
            conversationIdsMap.set(contactUid, conversationId);
          }
        } catch (e) {
          console.warn(`UnifiedChatService: Error processing conversation for ${contactUid}:`, e);
        }
      }

      // Fetch latest messages for all chats in batches
      const chatsToFetch = contactUids.map(uid => {
        const isCurrent = uid === userId;
        const conversationId = conversationIdsMap.get(uid);
        return { uid, isCurrent, chatId: conversationId };
      });

      // Fetch messages with aggressive caching - only fetch if cache is older than 30 seconds
      const latestMessagesMap = await this._fetchLatestMessagesInBatches(chatsToFetch, 12);

      // Build final chat entries
      const chatsData = [];
      contactUids.forEach(contactUid => {
        const userData = userDocsMap.get(contactUid) || {};
        const chatToFetch = chatsToFetch.find(c => c.uid === contactUid);
        const latestMessage = latestMessagesMap.get(contactUid);

        const chatEntry = {
          id: chatToFetch.chatId || contactUid, // Use conversation ID if available, fallback to user ID
          uid: contactUid,
          name: userData.full_name || userData.display_name || 'Unknown User',
          profilePicture: userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || userData.display_name || 'User')}`,
          photoURL: userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || userData.display_name || 'User')}`,
          email: userData.email || '',
          phone: userData.phone || '',
          status: userData.last_active_at ? (new Date() - new Date(userData.last_active_at)) < 300000 ? 'online' : 'offline' : 'offline',
          isYourself: contactUid === userId,
          isCurrent: contactUid === userId,
          chatId: chatToFetch.chatId, // This is now the conversation UUID
          lastMessage: latestMessage?.text || latestMessage?.message || null,
          lastMessageTimestamp: latestMessage?.timestamp ? new Date(latestMessage.timestamp) : null,
          lastMessageAt: latestMessage?.timestamp || null,
          lastActivity: latestMessage?.timestamp || null,
          lastMessageStatus: latestMessage?.status || null,
          lastMessageSenderUid: latestMessage?.sender || latestMessage?.senderId || null,
          messages: [],
          unreadCount: 0,
          isOnline: userData.last_active_at ? (new Date() - new Date(userData.last_active_at)) < 300000 : false,
          isPinned: false,
        };

        chatsData.push(chatEntry);
      });

      // Sort: self chat ALWAYS first, then pinned, then by lastActivity
      chatsData.sort((a, b) => {
        // Self chat always at top
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (b.lastActivity ? new Date(b.lastActivity) : 0) - (a.lastActivity ? new Date(a.lastActivity) : 0);
      });

      // Create fingerprint of message data
      const messageFingerprintData = new Map();
      chatsData.forEach(chat => {
        if (chat.lastMessageTimestamp) {
          messageFingerprintData.set(chat.uid, {
            id: chat.id,
            timestamp: chat.lastMessageTimestamp,
            created_at: chat.lastMessageTimestamp
          });
        }
      });
      const messageFingerprint = this._createMessageFingerprint(messageFingerprintData);

      return { chatsData, messageFingerprint };
    } catch (error) {
      console.error('❌ UnifiedChatService: Failed to fetch complete chats data:', error);
      return { chatsData: [], messageFingerprint: '' };
    }
  }

  /**
   * Fetch latest messages in batches to avoid overloading
   * Uses cache to prevent unnecessary re-fetches
   * Filters to show only text messages, not media
   * @private
   */
  async _fetchLatestMessagesInBatches(items, batchSize = 10) {
    const results = new Map();
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Filter out items we already have cached (30 second cache)
      const itemsNeedingFetch = batch.filter(item => {
        const cached = this.messageCache.get(item.chatId);
        if (!cached) return true;
        // If we have a recent cache (less than 10 seconds old), use it
        if (Date.now() - cached.fetchedAt < 10000) {
          if (cached.message) {
            results.set(item.uid, cached.message);
          }
          return false;
        }
        return true;
      });

      if (itemsNeedingFetch.length === 0) continue;

      try {
        const chatIds = itemsNeedingFetch.map(item => item.chatId).filter(Boolean);
        
        if (chatIds.length === 0) {
          // Fall back to Supabase for self-chats
          for (const item of itemsNeedingFetch) {
            if (item.isCurrent && item.chatId) {
              try {
                // Get last text message for self-chat
                const { data: messages } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('chat_id', item.chatId)
                  .eq('is_deleted', false)
                  .not('text', 'is', null) // Only messages with text content
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (messages && messages.length > 0) {
                  results.set(item.uid, messages[0]);
                  this.messageCache.set(item.chatId, { message: messages[0], fetchedAt: Date.now() });
                }
              } catch (e) {
                // Silent fail - self-chat may not have text messages
              }
            }
          }
          continue;
        }
        
        // Try API with short timeout
        const endpoint = '/api/messages/latest-batch';
        let apiSucceeded = false;
        
        try {
          const response = await Promise.race([
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatIds, limit: 20 }) // Get more to filter text
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]);
          
          if (response?.ok) {
            const responseData = await response.json();
            const messagesBatch = responseData.data || responseData.messages || {};
            
            // Map results back to items, finding last TEXT message only
            itemsNeedingFetch.forEach(item => {
              if (item.chatId && messagesBatch[item.chatId]) {
                const messages = Array.isArray(messagesBatch[item.chatId]) 
                  ? messagesBatch[item.chatId] 
                  : [messagesBatch[item.chatId]];
                
                // Find last message with actual text (not just media)
                const lastMessage = messages.find(m => {
                  if (!m) return false;
                  const hasText = m?.text || m?.message;
                  const isNotDeleted = !(m?.deleted_by || []).includes(item.uid);
                  return hasText && isNotDeleted;
                });
                
                if (lastMessage) {
                  results.set(item.uid, lastMessage);
                  this.messageCache.set(item.chatId, { message: lastMessage, fetchedAt: Date.now() });
                }
              }
            });
            apiSucceeded = true;
          }
        } catch (e) {
          // API failed or timeout, fall back to Supabase
        }
        
        // Fall back to Supabase for items not fetched from API
        if (!apiSucceeded) {
          for (const item of itemsNeedingFetch) {
            if (item.chatId && !results.has(item.uid)) {
              try {
                // Get last text message
                const { data: messages } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('chat_id', item.chatId)
                  .eq('is_deleted', false)
                  .not('text', 'is', null) // Only messages with text
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                
                if (messages) {
                  results.set(item.uid, messages);
                  this.messageCache.set(item.chatId, { message: messages, fetchedAt: Date.now() });
                }
              } catch (e) {
                // Silent fail - no text messages yet
              }
            }
          }
        }
      } catch (e) {
        console.debug(`UnifiedChatService: Failed to fetch latest messages batch:`, e.message);
      }
    }
    
    return results;
  }

  /**
   * Register a listener for chat updates
   */
  registerListener(userId, callback) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId).add(callback);
  }

  /**
   * Unregister a listener
   */
  unregisterListener(userId, callback) {
    const listeners = this.listeners.get(userId);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Notify all registered listeners of chat updates
   * @private
   */
  _notifyAllListeners(userId, chatsData) {
    const listeners = this.listeners.get(userId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(chatsData);
        } catch (e) {
          console.error('UnifiedChatService: Listener callback error:', e);
        }
      });
    }
  }

  /**
   * Get cached chat data for a user (synchronous)
   */
  getCachedChats(userId) {
    return this.chatData.get(userId) || [];
  }

  /**
   * Invalidate cache for a user
   */
  invalidateCache(userId) {
    const cacheKey = ChatCache.KEYS.CHATLIST(userId);
    ChatCache.clear(cacheKey);
    this.chatData.delete(userId);
  }

  /**
   * Refresh chat data for a user
   */
  async refreshChats(userId) {
    this.invalidateCache(userId);
    // The listener will automatically fetch fresh data
  }

  /**
   * Cleanup for a user (stop listening)
   * @private
   */
  _cleanup(userId) {
    const unsubscribe = this.unsubscribers.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(userId);
    }
    this.listeners.delete(userId);
    this.isInitialized.delete(userId);
    this.cachedUserDocs.delete(userId);
  }

  /**
   * Cleanup all users
   */
  cleanupAll() {
    this.unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        console.warn('UnifiedChatService: Cleanup error:', e);
      }
    });
    this.unsubscribers.clear();
    this.listeners.clear();
    this.isInitialized.clear();
    this.chatData.clear();
    this.cachedUserDocs.clear();
  }

  /**
   * Get detailed info about a specific chat
   */
  async getChatDetails(userId, contactUid) {
    try {
      const userData = await SupabaseChatService.getUser(contactUid);
      if (!userData) {
        console.warn(`UnifiedChatService: User ${contactUid} not found`);
        return null;
      }
      
      return {
        id: contactUid,
        uid: contactUid,
        name: userData.name,
        // profilePicture: userData.photo_url, // removed, column does not exist
        email: userData.email,
        phone: userData.phone,
        status: userData.status,
      };
    } catch (e) {
      console.error('UnifiedChatService: Failed to get chat details:', e);
      return null;
    }
  }
}

// Export singleton instance
export const UnifiedChatService = new UnifiedChatServiceClass();
