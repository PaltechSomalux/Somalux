/**
 * Supabase Chat Service
 * Replaces Firebase Firestore operations with Supabase equivalents
 */

import { supabase } from '../../Books/supabaseClient';

// ============================================================================
// CHAT OPERATIONS
// ============================================================================

/**
 * Create or get a chat between two users
 */
export const ensureChat = async (userId1, userId2) => {
  const chatId = [userId1, userId2].sort().join('_');
  const participantIds = [userId1, userId2];

  try {
    // Check if chat exists
    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .eq('chat_id', chatId)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new chat
    const { data, error } = await supabase
      .from('chats')
      .insert([
        {
          chat_id: chatId,
          participant_ids: participantIds,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error in ensureChat:', error);
    throw error;
  }
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(
        `
        id,
        chat_id,
        participant_ids,
        created_at,
        updated_at,
        is_archived,
        chat_messages (
          id,
          content,
          sender_id,
          created_at
        )
      `
      )
      .contains('participant_ids', [userId])
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getUserChats:', error);
    return [];
  }
};

/**
 * Subscribe to user's chats in real-time
 */
export const subscribeToUserChats = (userId, callback) => {
  const channel = supabase
    .channel(`user_chats_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `participant_ids.cs.{${userId}}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Send a message in a chat
 */
export const sendChatMessage = async (chatId, senderId, content, messageType = 'text') => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: senderId,
          content,
          message_type: messageType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get messages for a chat
 */
export const getChatMessages = async (chatId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

/**
 * Subscribe to messages in a chat
 */
export const subscribeToChatMessages = (chatId, callback) => {
  const channel = supabase
    .channel(`chat_messages_${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Update a message
 */
export const updateChatMessage = async (messageId, updates) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        ...updates,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteChatMessage = async (messageId) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// ============================================================================
// GROUP OPERATIONS
// ============================================================================

/**
 * Create a new group
 */
export const createGroup = async (groupData) => {
  const { name, description, creatorId, memberIds = [] } = groupData;
  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([
        {
          group_id: groupId,
          name,
          description,
          creator_id: creatorId,
          member_ids: [...memberIds, creatorId],
          admin_ids: [creatorId],
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

/**
 * Get all groups for a user
 */
export const getUserGroups = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .contains('member_ids', [userId])
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
};

/**
 * Send message to a group
 */
export const sendGroupMessage = async (groupId, senderId, content, messageType = 'text') => {
  try {
    const { data, error } = await supabase
      .from('group_messages')
      .insert([
        {
          group_id: groupId,
          sender_id: senderId,
          content,
          message_type: messageType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update group's updated_at
    await supabase
      .from('groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    return data;
  } catch (error) {
    console.error('Error sending group message:', error);
    throw error;
  }
};

/**
 * Get messages for a group
 */
export const getGroupMessages = async (groupId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  } catch (error) {
    console.error('Error getting group messages:', error);
    return [];
  }
};

/**
 * Subscribe to group messages
 */
export const subscribeToGroupMessages = (groupId, callback) => {
  const channel = supabase
    .channel(`group_messages_${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};


// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Get user profile with chat data
 */
export const getChatUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, profile_picture, is_online, last_online_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user online status
 */
export const updateUserOnlineStatus = async (userId, isOnline) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_online: isOnline,
        last_online_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

/**
 * Search users by email or name
 */
export const searchUsers = async (query) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, profile_picture, is_online')
      .or(
        `email.ilike.%${query}%,full_name.ilike.%${query}%`
      )
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// ============================================================================
// TYPING INDICATORS
// ============================================================================

/**
 * Set typing indicator
 */
export const setTypingIndicator = async (chatId, userId, groupId = null) => {
  try {
    const { error } = await supabase
      .from('typing_indicators')
      .insert([
        {
          chat_id: chatId,
          group_id: groupId,
          user_id: userId,
        },
      ]);

    if (error && error.code !== 'PGRST116') throw error;
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
};

/**
 * Subscribe to typing indicators
 */
export const subscribeToTypingIndicators = (chatId, callback) => {
  const channel = supabase
    .channel(`typing_${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
