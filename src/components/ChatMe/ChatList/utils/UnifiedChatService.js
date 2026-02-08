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
    this.apiFailureTimestamps = new Map(); // Track when APIs start failing for exponential backoff
    this.retryBackoffMs = new Map(); // chatId -> current backoff delay in ms
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

    // CLEAR MESSAGE CACHE TO FORCE FRESH FETCH
    this.messageCache.clear();
    console.log(`🧹 UnifiedChatService: Cleared messageCache to force fresh data fetch`);

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
      
      console.log(`🔔 UnifiedChatService: NOTIFYING listeners for ${userId}`, {
        chatsCount: chatsData.length,
        chatsWithMessages: chatsData.filter(c => c.lastMessage).length,
        dataChanged,
        messagesChanged,
        sampleChat: chatsData[0] ? {
          name: chatsData[0].name,
          lastMessage: chatsData[0].lastMessage,
          lastMessageTimestamp: chatsData[0].lastMessageTimestamp
        } : null
      });
      
      // Notify ALL listeners (mobile + desktop)
      this._notifyAllListeners(userId, chatsData);
    } else {
      console.log(`⏭️ UnifiedChatService: No changes detected, skipping notification for ${userId}`, {
        chatsCount: chatsData.length,
        dataChanged,
        messagesChanged
      });
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
          
          console.log(`🔗 UnifiedChatService: Looking up conversation for ${contactUid} (isSelfChat: ${isSelfChat})`);
          
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
            console.log(`✅ UnifiedChatService: Mapped ${contactUid} -> conversation ${conversationId}`);
          } else {
            console.warn(`❌ UnifiedChatService: No conversationId found or created for ${contactUid}`);
          }
        } catch (e) {
          console.warn(`UnifiedChatService: Error processing conversation for ${contactUid}:`, e);
        }
      }

      console.log(`🗺️ UnifiedChatService: conversationIdsMap populated with ${conversationIdsMap.size} entries:`, {
        mapping: Array.from(conversationIdsMap.entries()).map(([uid, convoId]) => ({
          uid,
          conversationId: convoId,
          isUnique: Array.from(conversationIdsMap.values()).filter(v => v === convoId).length === 1
        })),
        duplicateConversationIds: Array.from(new Set(
          Array.from(conversationIdsMap.values()).filter((v, i, arr) => arr.indexOf(v) !== i)
        ))
      });

      // ============================================================================
      // DEBUG: Verify what's ACTUALLY in the database
      // ============================================================================
      console.log(`🔍 UnifiedChatService: VERIFYING DATABASE STATE for user ${userId}`);
      
      try {
        // Check all conversations for this user
        const { data: allConvos, error: convoError } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .limit(20);
        
        console.log(`📋 UnifiedChatService: All conversations for ${userId}:`, {
          count: allConvos?.length || 0,
          conversations: allConvos ? allConvos.map(c => ({
            id: c.id,
            user1_id: c.user1_id,
            user2_id: c.user2_id,
            created_at: c.created_at
          })) : []
        });

        // For each conversation, show how many messages
        if (allConvos && allConvos.length > 0) {
          for (const convo of allConvos.slice(0, 5)) {
            const { data: msgs, count } = await supabase
              .from('messages')
              .select('id, text, content, message, created_at, sender_id, chat_id', { count: 'exact' })
              .eq('chat_id', convo.id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(2);
            
            console.log(`📬 UnifiedChatService: Messages in conversation ${convo.id}:`, {
              total: count,
              sampleMessages: msgs ? msgs.map(m => ({
                id: m.id,
                text: m.text?.substring(0, 30) || '(no text)',
                content: m.content?.substring(0, 30) || '(no content)',
                message: m.message?.substring(0, 30) || '(no message)',
                sender_id: m.sender_id,
                created_at: m.created_at
              })) : []
            });
          }
        }
      } catch (e) {
        console.warn(`⚠️ UnifiedChatService: Database verification failed:`, e.message);
      }
      // ============================================================================

      // Fetch latest messages for all chats in batches
      const chatsToFetch = contactUids.map(uid => {
        const isCurrent = uid === userId;
        const conversationId = conversationIdsMap.get(uid);
        return { uid, isCurrent, chatId: conversationId };
      });

      console.log(`📋 UnifiedChatService: chatsToFetch prepared (${chatsToFetch.length} items):`, {
        sample: chatsToFetch.slice(0, 3).map(c => ({
          uid: c.uid,
          chatId: c.chatId,
          isCurrent: c.isCurrent,
          hasConversationId: !!c.chatId
        })),
        missingConversationIds: chatsToFetch.filter(c => !c.chatId).length
      });

      // Fetch messages with aggressive caching - only fetch if cache is older than 30 seconds
      const latestMessagesMap = await this._fetchLatestMessagesInBatches(chatsToFetch, 12);

      console.log(`📬 UnifiedChatService: latestMessagesMap has ${latestMessagesMap.size} entries:`, {
        keys: Array.from(latestMessagesMap.keys()),
        sample: Array.from(latestMessagesMap.entries())
          .slice(0, 5)
          .map(([uid, msg]) => ({
            uid,
            messageId: msg?.id,
            text: msg?.text?.substring(0, 40),
            content: msg?.content?.substring(0, 40),
            message: msg?.message?.substring(0, 40),
            created_at: msg?.created_at,
            hasAnyContent: !!(msg?.text || msg?.content || msg?.message),
            chat_id_in_message: msg?.chat_id // IMPORTANT: verify message has correct chat_id
          }))
      });

      // Build final chat entries
      const chatsData = [];
      contactUids.forEach((contactUid, idx) => {
        const userData = userDocsMap.get(contactUid) || {};
        const chatToFetch = chatsToFetch.find(c => c.uid === contactUid);
        const latestMessage = latestMessagesMap.get(contactUid);

        console.log(`📝 UnifiedChatService: Building chat entry ${idx} for ${contactUid}:`, {
          contact: contactUid,
          conversationId: chatToFetch?.chatId,
          hasLatestMessage: !!latestMessage,
          latestMessageId: latestMessage?.id,
          latestMessageUID: latestMessage?.sender_id,
          latestMessageChatIdInDB: latestMessage?.chat_id,
          text: latestMessage?.text ? latestMessage.text.substring(0, 50) : '(none)',
          content: latestMessage?.content ? latestMessage.content.substring(0, 50) : '(none)',
          message: latestMessage?.message ? latestMessage.message.substring(0, 50) : '(none)',
          created_at: latestMessage?.created_at,
          timestamp: latestMessage?.timestamp,
          messageMatchesConversation: latestMessage?.chat_id === chatToFetch?.chatId
        });

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
          lastMessage: (() => {
            if (!latestMessage) return null;
            const messageText = latestMessage?.text || latestMessage?.content || latestMessage?.message || '';
            
            // Check if there are attachments
            if (latestMessage?.attachment_urls && latestMessage.attachment_urls.length > 0) {
              const firstAttachment = latestMessage.attachment_urls[0];
              const contentType = latestMessage.content_type || 'file';
              
              if (contentType.includes('image') || firstAttachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return `🖼 ${messageText || 'Photo'}`;
              } else if (contentType.includes('video') || firstAttachment.match(/\.(mp4|mov|avi|mkv)$/i)) {
                return `🎥 ${messageText || 'Video'}`;
              } else if (contentType.includes('audio') || firstAttachment.match(/\.(mp3|wav|m4a|ogg)$/i)) {
                return `🎵 ${messageText || 'Audio'}`;
              } else {
                return `📎 ${messageText || 'File'}`;
              }
            }
            return messageText || null;
          })(),
          lastMessageTimestamp: latestMessage?.timestamp || latestMessage?.created_at ? new Date(latestMessage?.timestamp || latestMessage?.created_at) : null,
          lastMessageAt: latestMessage?.timestamp || latestMessage?.created_at || null,
          lastActivity: latestMessage?.timestamp || latestMessage?.created_at || null,
          lastMessageStatus: latestMessage?.status || null,
          lastMessageSenderUid: latestMessage?.sender || latestMessage?.senderId || latestMessage?.sender_id || null,
          messages: [],
          unreadCount: 0,
          isOnline: userData.last_active_at ? (new Date() - new Date(userData.last_active_at)) < 300000 : false,
          isPinned: false,
        };

        if (idx < 3) {
          console.log(`✅ UnifiedChatService: Chat entry ${idx} built for ${contactUid}:`, {
            name: chatEntry.name,
            lastMessage: chatEntry.lastMessage ? chatEntry.lastMessage.substring(0, 50) : '(none)',
            lastMessageTimestamp: chatEntry.lastMessageTimestamp?.toISOString(),
            lastActivity: chatEntry.lastActivity,
            timestamp_type: typeof chatEntry.lastMessageTimestamp,
            message_exists: !!chatEntry.lastMessage,
            timestamp_exists: !!chatEntry.lastMessageTimestamp
          });
        }

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

      // VERIFY: Log final chatsData to ensure each chat has unique message
      const uniqueMessages = new Set(chatsData.map(c => c.lastMessage));
      const uniqueConversations = new Set(chatsData.map(c => c.chatId));
      
      console.log(`🎯 UnifiedChatService: Final chatsData verification - ${chatsData.length} total:`, {
        allChats: chatsData.map((c, i) => {
          const messageText = c.lastMessage ? c.lastMessage.substring(0, 40) : '(none)';
          const sameMessageCount = chatsData.filter(ch => 
            ch.lastMessage && c.lastMessage && ch.lastMessage === c.lastMessage
          ).length;
          
          return {
            idx: i,
            uid: c.uid,
            name: c.name,
            conversationId: c.chatId,
            message: messageText,
            timestamp: c.lastMessageTimestamp?.toISOString?.() || c.lastMessageTimestamp || '(none)',
            messageShareCount: sameMessageCount,
            isDuplicated: sameMessageCount > 1 ? '🔴 YES' : '✅ no'
          };
        }),
        problemIndicators: {
          totalChats: chatsData.length,
          chatsWithMessages: chatsData.filter(c => c.lastMessage).length,
          uniqueMessages: uniqueMessages.size,
          uniqueConversations: uniqueConversations.size,
          issue: uniqueMessages.size === 1 && chatsData.length > 1 ? '🔴 ALL SAME MESSAGE!' : 
                 uniqueConversations.size === 1 && chatsData.length > 1 ? '🔴 ALL SAME CONVERSATION!' : 
                 '✅ Looks OK'
        }
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
    console.log(`📨 UnifiedChatService: _fetchLatestMessagesInBatches starting for ${items.length} items`);
    const results = new Map();
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Filter out items we already have cached (30 second cache)
      const itemsNeedingFetch = batch.filter(item => {
        const cached = this.messageCache.get(item.chatId);
        if (!cached) {
          console.log(`🔄 UnifiedChatService: No cache for ${item.uid} (chatId: ${item.chatId})`);
          return true;
        }
        // If we have a recent cache (less than 10 seconds old), use it
        const age = Date.now() - cached.fetchedAt;
        if (age < 10000) {
          if (cached.message) {
            results.set(item.uid, cached.message);
            console.log(`♻️ UnifiedChatService: Using cached message for ${item.uid} (age: ${age}ms)`);
          }
          return false;
        }
        console.log(`⏰ UnifiedChatService: Cache expired for ${item.uid} (age: ${age}ms), will refetch`);
        return true;
      });

      if (itemsNeedingFetch.length === 0) {
        console.log(`✅ UnifiedChatService: All ${batch.length} items in batch already cached`);
        continue;
      }
      
      console.log(`🚀 UnifiedChatService: Need to fetch ${itemsNeedingFetch.length}/${batch.length} items in this batch`);

      try {
        const chatIds = itemsNeedingFetch.map(item => item.chatId).filter(Boolean);
        
        console.log(`🔍 UnifiedChatService: chatIds to fetch (${chatIds.length}):`, {
          chatIds: chatIds.slice(0, 3),
          itemUIDs: itemsNeedingFetch.map(i => i.uid).slice(0, 3),
          chatIdMapping: itemsNeedingFetch.slice(0, 3).map(i => ({ uid: i.uid, chatId: i.chatId }))
        });
        
        if (chatIds.length === 0) {
          console.warn(`⚠️ UnifiedChatService: No chatIds available, falling back to individual Supabase queries`);
          // Fall back to Supabase for self-chats
          for (const item of itemsNeedingFetch) {
            if (item.isCurrent && item.chatId) {
              try {
                console.log(`🔎 UnifiedChatService: Self-chat query for UID ${item.uid} using chatId: ${item.chatId}`);
                
                // Get last message for self-chat (any message, not just text)
                const { data: messages, error } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('chat_id', item.chatId)
                  .eq('is_deleted', false)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                console.log(`📭 UnifiedChatService: Self-chat query result for ${item.uid}:`, {
                  chatId: item.chatId,
                  messageCount: messages?.length || 0,
                  error: error?.message,
                  message: messages?.[0] ? {
                    id: messages[0].id,
                    text: messages[0].text?.substring(0, 30),
                    content: messages[0].content?.substring(0, 30),
                    created_at: messages[0].created_at
                  } : null
                });
                
                if (messages && messages.length > 0) {
                  results.set(item.uid, messages[0]);
                  this.messageCache.set(item.chatId, { message: messages[0], fetchedAt: Date.now() });
                  console.log(`✅ UnifiedChatService: Found self-chat message for ${item.uid}`);
                }
              } catch (e) {
                console.warn(`⚠️ UnifiedChatService: Error fetching self-chat messages for ${item.uid}:`, e.message);
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
            
            console.log(`📡 UnifiedChatService: API response for ${Object.keys(messagesBatch).length} chats:`, {
              allKeys: Object.keys(messagesBatch),
              sampleMessages: Object.entries(messagesBatch)
                .slice(0, 2)
                .map(([chatId, msgs]) => ({
                  chatId,
                  count: Array.isArray(msgs) ? msgs.length : 1,
                  first: Array.isArray(msgs) ? msgs[0] : msgs
                }))
            });
            
            // Map results back to items, finding last TEXT message only
            console.log(`🔀 UnifiedChatService: Mapping API results to ${itemsNeedingFetch.length} items:`, {
              requestedChatIds: itemsNeedingFetch.map(i => i.chatId).slice(0, 3),
              returnedKeys: Object.keys(messagesBatch).slice(0, 3)
            });
            
            itemsNeedingFetch.forEach(item => {
              console.log(`🔍 UnifiedChatService: Looking for ${item.uid} with chatId: ${item.chatId}`, {
                chatIdInResponse: item.chatId ? (item.chatId in messagesBatch) : false,
                messagesBatchKeys: Object.keys(messagesBatch).slice(0, 3)
              });
              
              if (item.chatId && messagesBatch[item.chatId]) {
                const messages = Array.isArray(messagesBatch[item.chatId]) 
                  ? messagesBatch[item.chatId] 
                  : [messagesBatch[item.chatId]];
                
                // Find last message with actual text (not just media)
                console.log(`📦 UnifiedChatService: Processing ${messages.length} messages for ${item.uid} from API`);
                
                const lastMessage = messages.find(m => {
                  if (!m) return false;
                  const hasText = m?.text || m?.message || m?.content;
                  const isNotDeleted = !(m?.deleted_by || []).includes(item.uid);
                  const isValid = hasText && isNotDeleted;
                  
                  if (!isValid) {
                    console.log(`❌ UnifiedChatService: Message filtered out - hasText: ${!!hasText}, text: "${m?.text}", message: "${m?.message}", content: "${m?.content}", isNotDeleted: ${isNotDeleted}`);
                  }
                  
                  return isValid;
                });
                
                if (lastMessage) {
                  results.set(item.uid, lastMessage);
                  this.messageCache.set(item.chatId, { message: lastMessage, fetchedAt: Date.now() });
                  console.log(`✅ UnifiedChatService: Found message from API for ${item.uid}:`, {
                    text: lastMessage?.text,
                    content: lastMessage?.content,
                    message: lastMessage?.message,
                    timestamp: lastMessage?.created_at
                  });
                } else {
                  console.warn(`⚠️ UnifiedChatService: No valid message found for ${item.uid} (had ${messages.length} messages)`);
                }
              } else {
                console.warn(`📭 UnifiedChatService: No data in API response for ${item.uid} (chatId: ${item.chatId})`);
              }
            });
            apiSucceeded = true;
          }
        } catch (e) {
          // API failed or timeout, fall back to Supabase
        }
        
        // Fall back to Supabase for items not fetched from API
        if (!apiSucceeded) {
          console.log(`🔄 UnifiedChatService: API failed, falling back to Supabase for ${itemsNeedingFetch.length} items`);
          
          for (const item of itemsNeedingFetch) {
            if (item.chatId && !results.has(item.uid)) {
              try {
                console.log(`🔎 UnifiedChatService: Supabase query for UID ${item.uid} using chatId: ${item.chatId}`);
                
                // Get last messages (any message, not just text)
                const { data: messages, error } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('chat_id', item.chatId)
                  .eq('is_deleted', false)
                  .order('created_at', { ascending: false })
                  .limit(5); // Get more to find one with text/content
                
                if (error) {
                  console.warn(`❌ UnifiedChatService: Query error for ${item.uid} (chatId: ${item.chatId}):`, error);
                  continue;
                }
                
                console.log(`📭 UnifiedChatService: Supabase query result for ${item.uid}:`, {
                  chatId: item.chatId,
                  messageCount: messages?.length || 0,
                  messages: messages ? messages.map(m => ({
                    id: m.id,
                    text: m.text?.substring(0, 30) || '(no text)',
                    content: m.content?.substring(0, 30) || '(no content)',
                    message: m.message?.substring(0, 30) || '(no message)',
                    created_at: m.created_at,
                    chat_id_in_db: m.chat_id // VERIFY correct chat_id
                  })) : []
                });
                
                if (!messages || messages.length === 0) {
                  console.log(`📭 UnifiedChatService: No messages found for ${item.uid} (chatId: ${item.chatId})`);
                  continue;
                }
                
                // Find first message with actual content
                const lastMessage = messages.find(m => {
                  if (!m) return false;
                  const hasContent = m?.text || m?.message || m?.content;
                  return hasContent;
                });
                
                if (lastMessage) {
                  console.log(`✅ UnifiedChatService: Found message for ${item.uid}:`, {
                    messageId: lastMessage.id,
                    text: lastMessage.text,
                    content: lastMessage.content,
                    message: lastMessage.message,
                    timestamp: lastMessage.created_at,
                    chat_id_in_db: lastMessage.chat_id
                  });
                  
                  results.set(item.uid, lastMessage);
                  this.messageCache.set(item.chatId, { message: lastMessage, fetchedAt: Date.now() });
                } else {
                  console.warn(`⚠️ UnifiedChatService: ${messages.length} messages exist but none have text/content for ${item.uid}`);
                  // If no message has text, just use the first one
                  results.set(item.uid, messages[0]);
                  this.messageCache.set(item.chatId, { message: messages[0], fetchedAt: Date.now() });
                  console.log(`ℹ️ UnifiedChatService: Using first message even without explicit text for ${item.uid}:`, {
                    messageId: messages[0].id,
                    fields: Object.keys(messages[0] || {}).slice(0, 8)
                  });
                }
              } catch (e) {
                console.warn(`⚠️ UnifiedChatService: Exception fetching messages for ${item.chatId}:`, e.message);
              }
            }
          }
        }
      } catch (e) {
        console.debug(`UnifiedChatService: Failed to fetch latest messages batch:`, e.message);
      }
    }
    
    console.log(`📊 UnifiedChatService: _fetchLatestMessagesInBatches completed with ${results.size}/${items.length} messages found`, {
      itemsRequested: items.map(i => i.uid).join(', '),
      itemsFound: Array.from(results.keys()).join(', '),
      resultsByItem: items.map(item => ({
        uid: item.uid,
        hasMessage: results.has(item.uid),
        message: results.get(item.uid) ? {
          id: results.get(item.uid).id,
          text: results.get(item.uid).text?.substring(0, 40),
          content: results.get(item.uid).content?.substring(0, 40),
          message: results.get(item.uid).message?.substring(0, 40),
          created_at: results.get(item.uid).created_at
        } : null
      }))
    });
    
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
   * Retry a Supabase query with exponential backoff
   * Helps handle 503 Service Unavailable errors gracefully
   * @private
   */
  async _retryWithBackoff(queryFn, chatId, maxRetries = 3) {
    let lastError;
    let delay = 1000; // Start with 1 second
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        const is503 = error?.message?.includes('503') || error?.code === 'PGRST503';
        
        if (is503 && i < maxRetries - 1) {
          // 503 error - we should retry with backoff
          console.warn(`⏱️ UnifiedChatService: Got 503, retrying after ${delay}ms (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff: 1s -> 2s -> 4s
        } else if (is503) {
          // Last attempt and still 503 - give up and return null
          console.warn(`❌ UnifiedChatService: 503 after ${maxRetries} retries, giving up`);
          return null;
        } else {
          // Different error, don't retry
          throw error;
        }
      }
    }
    
    console.error(`❌ UnifiedChatService: All ${maxRetries} retries failed:`, lastError?.message);
    return null;
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
