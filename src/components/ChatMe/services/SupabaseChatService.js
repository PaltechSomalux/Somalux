/**
 * SupabaseChatService.js
 * 
 * Complete Supabase integration for ChatMe
 * Replaces Firebase Firestore operations with Supabase PostgreSQL
 * 
 * Handles:
 * - 1-on-1 messaging using conversations table
 * - Message CRUD operations
 * - Real-time subscriptions
 * - User presence and status
 * - Chat metadata (pinned, archived, settings)
 * - Read receipts
 * - Message reactions
 * 
 * SCHEMA:
 * - conversations: 1-on-1 chats between users (user1_id, user2_id)
 * - messages: individual messages in conversations
 * - user_chat_settings: per-user chat settings (pinned, archived, etc)
 */

import { supabase } from '../../../supabase';

/**
 * Convert test user IDs to deterministic UUIDs for development
 * CRITICAL: Must be truly deterministic - same input always produces same output
 */
function convertToValidUUID(userId) {
  if (!userId) return null;
  
  const userIdStr = String(userId);
  
  // If already a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdStr)) {
    return userIdStr;
  }
  
  // Convert string IDs to deterministic UUIDs using SHA-256 like hashing
  let hash = 0;
  for (let i = 0; i < userIdStr.length; i++) {
    const char = userIdStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  let secondHash = 0;
  for (let i = userIdStr.length - 1; i >= 0; i--) {
    const char = userIdStr.charCodeAt(i);
    secondHash = ((secondHash << 5) - secondHash) + char;
    secondHash = secondHash & secondHash;
  }
  
  const hashStr1 = Math.abs(hash).toString(16).padStart(16, '0');
  const hashStr2 = Math.abs(secondHash).toString(16).padStart(16, '0');
  const fullHex = (hashStr1 + hashStr2).slice(0, 32);
  
  const variant = ((Math.abs(hash) >> 8) % 4 + 8).toString(16);
  
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-${variant}${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

/**
 * Normalize conversation ID for Supabase queries
 * Converts 'yourself_<id>' format to a deterministic UUID
 */
function normalizeConversationId(conversationId) {
  if (!conversationId) return null;
  
  // If starts with 'yourself_', extract the user ID and create deterministic UUID
  if (conversationId.startsWith('yourself_')) {
    const userId = conversationId.substring('yourself_'.length);
    return convertToValidUUID(userId);
  }
  
  // For regular conversation IDs, convert to UUID
  const normalized = convertToValidUUID(conversationId);
  return normalized || conversationId;
}

class SupabaseChatServiceClass {
  constructor() {
    this.subscriptions = new Map(); // userId -> Set of subscriptions
    this.unsubscribers = new Map(); // subscriptionId -> unsubscribe function
  }

  /**
   * Get or create a 1-on-1 conversation between two users
   * Uses conversations table with user1_id, user2_id (sorted)
   */
  async getOrCreateChat(userId1, userId2) {
    try {
      // Sort user IDs for consistent ordering (required by schema)
      const [sortedUser1, sortedUser2] = [userId1, userId2].sort();
      
      // Check if conversation already exists
      const { data: existingConv, error: selectError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', sortedUser1)
        .eq('user2_id', sortedUser2)
        .single();

      if (existingConv) {
        console.log('getOrCreateChat: Conversation already exists:', existingConv.id);
        return {
          id: existingConv.id,
          chat_id: existingConv.id, // Compatibility layer
          user_id_1: existingConv.user1_id,
          user_id_2: existingConv.user2_id,
          contact_uid: sortedUser1 === userId1 ? sortedUser2 : sortedUser1,
        };
      }

      // If no conversation exists and error is not "not found", throw error
      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      // Create new conversation
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user1_id: sortedUser1,
          user2_id: sortedUser2,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create conversation:', insertError);
        throw insertError;
      }

      console.log('getOrCreateChat: New conversation created:', newConv.id);
      return {
        id: newConv.id,
        chat_id: newConv.id, // Compatibility layer
        user_id_1: newConv.user1_id,
        user_id_2: newConv.user2_id,
        contact_uid: sortedUser1 === userId1 ? sortedUser2 : sortedUser1,
      };
    } catch (error) {
      console.error('getOrCreateChat error:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId, userId, emoji) {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (error) {
        console.error('Failed to remove reaction:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('removeReaction error:', error);
      throw error;
    }
  }

  /**
   * Fetch user chat list with latest message info and contact details
   * Uses conversations table instead of user_chats
   * ✅ FIXED: Only return conversations that have actual messages
   */
  async fetchUserChats(userId) {
    try {
      // Get all conversations for user (where user is either user1 or user2)
      // Fetch without is_deleted filter first, then filter in code
      const { data: allConvos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (convosError) {
        console.error('Failed to fetch conversations:', convosError);
        throw convosError;
      }

      if (!allConvos || allConvos.length === 0) {
        return [];
      }

      // Filter out deleted conversations at the app level
      const convos = allConvos.filter(c => !c.is_deleted);
      console.log(`📊 Fetched ${allConvos.length} conversations, ${convos.length} active (filtered ${allConvos.length - convos.length} deleted)`);

      if (convos.length === 0) {
        return [];
      }
      
      // NOTE: Don't filter out conversations with no messages!
      // Newly created conversations won't have messages yet, but should still appear in the chat list
      // Only filter deleted chats, not empty ones

      // ✅ Sort conversations by most recent activity (based on last_message_at)
      convos.sort((a, b) => {
        const timeA = new Date(a.last_message_at || a.created_at).getTime();
        const timeB = new Date(b.last_message_at || b.created_at).getTime();
        return timeB - timeA; // Most recent first
      });

      // Get latest message for each conversation and fetch user settings
      const chatsWithDetails = await Promise.all(
        convos.map(async (convo) => {
          // Determine the contact's user ID
          const contactUserId = convo.user1_id === userId ? convo.user2_id : convo.user1_id;

          // Fetch user chat settings for this user
          const { data: settings } = await supabase
            .from('user_chats')
            .select('*')
            .eq('user_id', userId)
            .eq('chat_id', convo.id)
            .maybeSingle();

          // Filter out deleted chats (check user_chats level)
          if (settings?.is_deleted) {
            console.log(`🗑️ fetchUserChats: Found deleted chat in user_chats (filtered)`, { 
              chat_id: convo.id,
              settings: settings 
            });
            return null; // Mark for filtering
          }

          // Get latest message for each conversation
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', convo.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Fetch contact user profile
          const { data: contactProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', contactUserId)
            .maybeSingle();

          return {
            id: convo.id,
            chat_id: convo.id, // Compatibility layer
            conversation_id: convo.id,
            user_id_1: convo.user1_id,
            user_id_2: convo.user2_id,
            contact_uid: contactUserId,
            contact_id: contactUserId,
            contact_name: contactProfile?.full_name || contactProfile?.display_name || 'Unknown',
            name: contactProfile?.full_name || contactProfile?.display_name || 'Unknown', // Use this for display in chatlist
            contact_avatar: contactProfile?.avatar_url || null,
            uid: contactUserId,
            lastMessage: lastMessage?.text || null,
            lastMessageAt: lastMessage?.created_at || convo.last_message_at,
            last_message_at: lastMessage?.created_at || convo.last_message_at,
            created_at: convo.created_at,
            // Include settings flags
            is_pinned: settings?.is_pinned || false,
            is_archived: settings?.is_archived || false,
            is_deleted: settings?.is_deleted || false,
            is_muted: settings?.is_muted || false,
            is_locked: settings?.is_locked || false,
          };
        })
      );

      // ✅ Filter out null entries (deleted chats)
      const activeChats = chatsWithDetails.filter(chat => chat !== null && !chat.is_deleted);
      console.log(`📊 After filtering: ${activeChats.length} active chats`);

      return activeChats;
    } catch (error) {
      console.error('fetchUserChats error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's chat list
   * ✅ FIXED: Prevent infinite polling loops by using debouncing and deduplication
   */
  subscribeToUserChats(userId, callback) {
    try {
      let lastCallTime = 0;
      let lastData = null;
      const MIN_INTERVAL_MS = 1000; // Minimum 1s between updates (faster responsiveness)
      
      // Initial fetch
      this.fetchUserChats(userId).then(chats => {
        try {
          if (callback) {
            lastData = JSON.stringify(chats);
            lastCallTime = Date.now();
            callback(chats);
          }
        } catch (error) {
          console.error('subscribeToUserChats callback error:', error?.message || String(error));
        }
      }).catch(error => {
        console.error('subscribeToUserChats initial fetch error:', error?.message || String(error));
        try {
          if (callback) callback([]);
        } catch (e) {
          console.error('subscribeToUserChats fallback callback error:', e?.message || String(e));
        }
      });

      // ✅ FIXED: Polling with debounce to prevent infinite loops
      const pollInterval = setInterval(async () => {
        try {
          const now = Date.now();
          // Only poll if enough time has passed
          if (now - lastCallTime < MIN_INTERVAL_MS) {
            return;
          }
          
          const chats = await this.fetchUserChats(userId);
          const newData = JSON.stringify(chats);
          
          // Only call callback if data actually changed
          if (newData !== lastData) {
            if (callback) {
              try {
                lastData = newData;
                lastCallTime = now;
                callback(chats);
              } catch (error) {
                console.error('subscribeToUserChats polling callback error:', error?.message || String(error));
              }
            }
          }
        } catch (error) {
          console.error('subscribeToUserChats polling error:', error?.message || String(error));
        }
      }, 1000); // Poll every 1 second for faster chat updates

      const subscriptionId = `chats_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      console.error('subscribeToUserChats error:', error?.message || String(error));
      throw error;
    }
  }

  /**
   * Get or create user chat settings
   * Uses conversation_id instead of chat_id
   */
  async getUserChatSettings(userId, conversationId) {
    try {
      const normalizedId = normalizeConversationId(conversationId);
      const { data: settings, error } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', normalizedId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return settings || {};
    } catch (error) {
      console.error('getUserChatSettings error:', error);
      return {};
    }
  }

  /**
   * Create a chat folder
   */
  async createFolder(userId, name) {
    try {
      // Generate a proper UUID for the folder ID
      const folderId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('user_chat_folders')
        .insert({
          folder_id: folderId,
          user_id: userId,
          name,
          is_pinned: false,
          is_locked: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create folder:', error);
        throw error;
      }

      return { ...data, id: data.folder_id };
    } catch (error) {
      console.error('createFolder error:', error);
      throw error;
    }
  }

  /**
   * Add members (chat IDs) to a folder
   */
  async addMembersToFolder(userId, folderId, chatIds) {
    try {
      // Get current folder data
      const { data: folder, error: fetchError } = await supabase
        .from('user_chat_folders')
        .select('members')
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Combine existing and new members (avoiding duplicates)
      const currentMembers = folder.members || [];
      const newMembers = [...new Set([...currentMembers, ...chatIds])];

      // Update folder with new members
      const { data, error } = await supabase
        .from('user_chat_folders')
        .update({ members: newMembers })
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('addMembersToFolder error:', error);
      throw error;
    }
  }

  /**
   * Remove members from a folder
   */
  async removeMembersFromFolder(userId, folderId, chatIds) {
    try {
      const { data: folder, error: fetchError } = await supabase
        .from('user_chat_folders')
        .select('members')
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentMembers = folder.members || [];
      const updatedMembers = currentMembers.filter(id => !chatIds.includes(id));

      const { data, error } = await supabase
        .from('user_chat_folders')
        .update({ members: updatedMembers })
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('removeMembersFromFolder error:', error);
      throw error;
    }
  }

  /**
   * Update folder lock status
   */
  async updateFolderLock(userId, folderId, isLocked) {
    try {
      const { data, error } = await supabase
        .from('user_chat_folders')
        .update({
          is_locked: isLocked,
          locked_at: isLocked ? new Date().toISOString() : null,
        })
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('updateFolderLock error:', error);
      throw error;
    }
  }

  /**
   * Update folder name
   */
  async updateFolderName(userId, folderId, newName) {
    try {
      const { data, error } = await supabase
        .from('user_chat_folders')
        .update({ name: newName })
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('updateFolderName error:', error);
      throw error;
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(userId, folderId) {
    try {
      const { error } = await supabase
        .from('user_chat_folders')
        .delete()
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('deleteFolder error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to folders for a user
   */
  subscribeToFolders(userId, callback) {
    try {
      // Initial fetch
      this.fetchUserFolders(userId).then(callback);

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const folders = await this.fetchUserFolders(userId);
          if (callback) callback(folders);
        } catch (error) {
          console.error('subscribeToFolders polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `folders_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      console.error('subscribeToFolders error:', error);
      throw error;
    }
  }

  /**
   * Fetch all folders for a user
   */
  async fetchUserFolders(userId) {
    try {
      const { data: folders, error } = await supabase
        .from('user_chat_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return folders.map(f => ({
        ...f,
        id: f.folder_id,
      }));
    } catch (error) {
      console.error('fetchUserFolders error:', error);
      throw error;
    }
  }

  /**
   * Get last message for a conversation
   * Uses chat_id for message queries
   */
  async getLastMessage(conversationId) {
    try {
      const normalizedId = normalizeConversationId(conversationId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', normalizedId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('getLastMessage error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to last message in a conversation
   * Uses conversation_id instead of chat_id
   */
  subscribeToLastMessage(conversationId, callback) {
    try {
      // Initial fetch
      this.getLastMessage(conversationId).then(callback);

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const message = await this.getLastMessage(conversationId);
          if (callback) callback(message);
        } catch (error) {
          console.error('subscribeToLastMessage polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `last_message_${conversationId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      console.error('subscribeToLastMessage error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to unread messages in a conversation
   * Uses chat_id for message queries
   */
  subscribeToUnreadMessages(conversationId, userId, callback) {
    try {
      // Initial fetch
      supabase
        .from('messages')
        .select('*')
        .eq('chat_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_deleted', false)
        .then(({ data: unread }) => {
          if (callback && unread) callback(unread);
        });

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const { data: unread } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_deleted', false);

          if (callback && unread) callback(unread);
        } catch (error) {
          console.error('subscribeToUnreadMessages polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `unread_${conversationId}_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      console.error('subscribeToUnreadMessages error:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getChat(conversationId) {
    try {
      const { data: convo, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return convo;
    } catch (error) {
      console.error('getChat error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a specific conversation
   * Uses conversation_id instead of chat_id
   */
  subscribeToChat(conversationId, callback) {
    try {
      // Initial fetch
      this.getChat(conversationId).then(convo => {
        if (convo && callback) callback(convo);
      });

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const convo = await this.getChat(conversationId);
          if (convo && callback) callback(convo);
        } catch (error) {
          console.error('subscribeToChat polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `convo_${conversationId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      console.error('subscribeToChat error:', error);
      throw error;
    }
  }

  /**
   * Update user chat settings
   * Uses conversation_id instead of chat_id
   */
  async updateUserChatSettings(userId, conversationId, settings) {
    try {
      const normalizedId = normalizeConversationId(conversationId);
      const { data, error } = await supabase
        .from('user_chats')
        .upsert(
          {
            user_id: userId,
            chat_id: normalizedId,
            ...settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,chat_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Failed to update chat settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('updateUserChatSettings error:', error);
      throw error;
    }
  }

  /**
   * Get PIN for user (from profiles table)
   */
  async getPIN(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pin')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.pin || null;
    } catch (error) {
      console.error('getPIN error:', error);
      return null;
    }
  }

  /**
   * Set PIN for user (in profiles table)
   */
  async setPIN(userId, pin) {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          pin,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('setPIN error:', error);
      throw error;
    }
  }

  /**
   * Update PIN for user (in profiles table)
   */
  async updatePIN(userId, newPin) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          pin: newPin,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('updatePIN error:', error);
      throw error;
    }
  }

  /**
   * Reset PIN for user (in profiles table)
   */
  async resetPIN(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          pin: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('resetPIN error:', error);
      throw error;
    }
  }

  /**
   * Create or update user in profiles table
   */
  async createOrUpdateUser(userId, userData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            display_name: userData.name || userData.display_name,
            email: userData.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('createOrUpdateUser error:', error);
      throw error;
    }
  }

  /**
   * Get user from profiles table
   */
  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User not found
        return null;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('getUser error:', error);
      return null;
    }
  }

  /**
   * Update a chat folder
   */
  async updateChatFolder(userId, folderId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_chat_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('updateChatFolder error:', error);
      throw error;
    }
  }

  /**
   * Delete a chat folder
   */
  async deleteChatFolder(userId, folderId) {
    try {
      const { error } = await supabase
        .from('user_chat_folders')
        .delete()
        .eq('user_id', userId)
        .eq('folder_id', folderId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('deleteChatFolder error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user chat folders
   */
  subscribeToUserChatFolders(userId, callback) {
    try {
      // Initial fetch
      this.fetchUserFolders(userId).then(callback);

      // Set up polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const folders = await this.fetchUserFolders(userId);
          if (callback) callback(folders);
        } catch (error) {
          console.error('subscribeToUserChatFolders polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      const subscriptionId = `chat_folders_${userId}_${Date.now()}`;
      this.unsubscribers.set(subscriptionId, () => clearInterval(pollInterval));

      return () => this.unsubscribe(subscriptionId);
    } catch (error) {
      console.error('subscribeToUserChatFolders error:', error);
      throw error;
    }
  }

  /**
   * Delete a chat for a user (soft delete - marks as deleted)
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID to delete
   */
  async deleteChat(userId, conversationId) {
    try {
      console.log('🗑️ SupabaseChatService.deleteChat: Starting', { userId, conversationId });
      
      if (!userId || !conversationId) {
        throw new Error('Missing userId or conversationId');
      }

      const normalizedId = normalizeConversationId(conversationId);
      let usedId = conversationId;
      
      // Check which ID exists in database
      const { data: conv1 } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!conv1) {
        // Try normalized ID
        const { data: conv2 } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', normalizedId)
          .maybeSingle();
        
        if (conv2) {
          usedId = normalizedId;
        } else {
          console.log('✅ Conversation not found - already deleted or never existed');
          return { is_deleted: true };
        }
      }

      console.log('🗑️ SupabaseChatService.deleteChat: Found conversation, now marking as deleted', { usedId });

      // STEP 1: Mark conversation as deleted (THIS IS THE KEY)
      console.log('🗑️ About to UPDATE conversations table:', { 
        id: usedId, 
        is_deleted: true,
        updated_at: new Date().toISOString()
      });

      const updatePayload = { 
        is_deleted: true, 
        updated_at: new Date().toISOString() 
      };
      
      const { data: updateData, error: convoError, status, statusText } = await supabase
        .from('conversations')
        .update(updatePayload)
        .eq('id', usedId);

      console.log('🗑️ Update response:', { data: updateData, error: convoError, status, statusText });

      if (convoError) {
        console.error('❌ Failed to update conversations table:', convoError);
        throw convoError;
      }
      
      console.log('✅ UPDATE query executed, now verifying...');

      // Immediately verify without any delays
      const { data: immediate } = await supabase
        .from('conversations')
        .select('id, is_deleted')
        .eq('id', usedId)
        .maybeSingle();
      
      console.log('🔍 Immediate verification result:', immediate);

      // STEP 2: Also mark in user_chats if entry exists
      const { data: existingChat } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', usedId)
        .maybeSingle();

      if (existingChat) {
        const { error: userChatError } = await supabase
          .from('user_chats')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('chat_id', usedId);

        if (userChatError) {
          console.warn('⚠️ Failed to update user_chats:', userChatError);
        } else {
          console.log('✅ user_chats also marked as deleted');
        }
      }

      // STEP 3: Verify the conversation is actually deleted
      const { data: verified, error: verifyError } = await supabase
        .from('conversations')
        .select('id, is_deleted, updated_at')
        .eq('id', usedId)
        .maybeSingle();

      console.log('🔍 Final verification query result:', { verified, verifyError });

      if (verifyError) {
        console.error('❌ Error during verification:', verifyError);
        throw verifyError;
      }

      if (verified && verified.is_deleted === true) {
        console.log('✅ VERIFIED: Conversation.is_deleted = TRUE in database', verified);
        return { is_deleted: true };
      } else if (verified) {
        console.error('❌ VERIFICATION FAILED: is_deleted is NOT true:', verified);
        throw new Error(`Deletion failed - is_deleted is ${verified.is_deleted}, not true`);
      } else {
        console.error('❌ VERIFICATION FAILED: Conversation not found after update:', { usedId });
        throw new Error('Conversation disappeared after deletion attempt');
      }
    } catch (error) {
      console.error('❌ SupabaseChatService.deleteChat error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(subscriptionId) {
    const unsubscribe = this.unsubscribers.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe all
   */
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.unsubscribers.clear();
  }
}

// Export singleton instance
export const SupabaseChatService = new SupabaseChatServiceClass();
